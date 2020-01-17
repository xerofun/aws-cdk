import { FileAssetPackaging, ManifestFileAsset } from "@aws-cdk/assets";
import * as fs from 'fs-extra';
import * as path from 'path';
import { zipDirectory } from '../private/archive';
import { IAssetHandler, MessageSink } from "../private/asset-handler";
import { s3Client } from "../private/sdk";

export class FileAssetHandler implements IAssetHandler {
  private publishFile?: string;
  private readonly fileCacheRoot: string;

  constructor(
    private readonly root: string,
    private readonly assetId: string,
    private readonly asset: ManifestFileAsset,
    private readonly message: MessageSink) {
    this.fileCacheRoot = path.join(root, '.cache');
  }

  public async package(): Promise<void> {
    const fullPath = path.join(this.root, this.asset.source.path);

    if (this.asset.source.packaging === FileAssetPackaging.ZIP_DIRECTORY) {
      await fs.mkdirp(this.fileCacheRoot);
      this.publishFile = path.join(this.fileCacheRoot, `${this.assetId}.zip`);

      if (!await fs.pathExists(this.publishFile)) {
        this.message(`Zip ${fullPath} -> ${this.publishFile}`);
        await zipDirectory(fullPath, this.publishFile);
      } else {
        this.message(`From cache ${this.publishFile}`);
      }
    } else {
      this.publishFile = fullPath;
    }
  }

  public async publish(destinationId: string): Promise<void> {
    if (!this.publishFile) { throw new Error('Call package() first'); }
    const contentType = this.asset.source.packaging === FileAssetPackaging.ZIP_DIRECTORY ? 'application/zip' : undefined;

    const destination = this.asset.destinations[destinationId];

    if (destination.assumeRoleArn) {
      const msg = [`Assume ${destination.assumeRoleArn}`];
      if (destination.assumeRoleExternalId) {
        msg.push(`(ExternalId ${destination.assumeRoleExternalId})`);
      }
      this.message(msg.join(' '));
    }

    const s3 = s3Client({
      region: destination.region,
      assumeRoleArn: destination.assumeRoleArn,
      assumeRoleExternalId: destination.assumeRoleExternalId
    });

    const s3Url = `s3://${destination.bucketName}/${destination.objectKey}`;

    this.message(`Check ${s3Url}`);
    if (await objectExists(s3, destination.bucketName, destination.objectKey)) {
      this.message(`Found ${s3Url}`);
      return;
    }

    this.message(`Upload ${s3Url}`);
    await s3.putObject({
      Bucket: destination.bucketName,
      Key: destination.objectKey,
      Body: fs.createReadStream(this.publishFile),
      ContentType: contentType
    }).promise();
  }
}

async function objectExists(s3: AWS.S3, bucket: string, key: string) {
  try {
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return true;
  } catch (e) {
    if (e.code === 'NotFound') {
      return false;
    }

    throw e;
  }
}