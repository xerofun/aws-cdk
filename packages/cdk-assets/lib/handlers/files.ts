import { FileAssetPackaging, ManifestFileAsset } from "@aws-cdk/assets";
import * as fs from 'fs-extra';
import * as path from 'path';
import { zipDirectory } from '../private/archive';
import { IAssetHandler, MessageSink } from "../private/asset-handler";
import { s3Client } from "../private/sdk";

export class FileAssetHandler implements IAssetHandler {
  private readonly fileCacheRoot: string;

  constructor(
    private readonly root: string,
    private readonly asset: ManifestFileAsset,
    private readonly message: MessageSink) {
    this.fileCacheRoot = path.join(root, '.cache');
  }

  public async publish(): Promise<void> {
    const destination = this.asset.fileDestination;
    const s3Url = `s3://${destination.bucketName}/${destination.objectKey}`;

    const s3 = s3Client(destination, this.message);
    this.message(`Check ${s3Url}`);
    if (await objectExists(s3, destination.bucketName, destination.objectKey)) {
      this.message(`Found ${s3Url}`);
      return;
    }

    const publishFile = await this.package();
    const contentType = this.asset.source.packaging === FileAssetPackaging.ZIP_DIRECTORY ? 'application/zip' : undefined;

    this.message(`Upload ${s3Url}`);
    await s3.putObject({
      Bucket: destination.bucketName,
      Key: destination.objectKey,
      Body: fs.createReadStream(publishFile),
      ContentType: contentType
    }).promise();
  }

  public async package(): Promise<string> {
    const source = this.asset.fileSource;
    const fullPath = path.join(this.root, this.asset.source.path);

    if (source.packaging === FileAssetPackaging.ZIP_DIRECTORY) {
      await fs.mkdirp(this.fileCacheRoot);
      const ret = path.join(this.fileCacheRoot, `${this.asset.id.assetId}.zip`);

      if (await fs.pathExists(ret)) {
        this.message(`From cache ${ret}`);
        return ret;
      }

      this.message(`Zip ${fullPath} -> ${ret}`);
      await zipDirectory(fullPath, ret);
      return ret;
    } else {
      return fullPath;
    }
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