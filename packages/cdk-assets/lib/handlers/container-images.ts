import { ManifestContainerImageAsset } from "@aws-cdk/assets";
import * as path from 'path';
import { IAssetHandler, MessageSink } from "../private/asset-handler";
import { Docker } from "../private/docker";
import { ecrClient } from "../private/sdk";

export class ContainerImageAssetHandler implements IAssetHandler {
  private readonly localTagName: string;
  private readonly docker = new Docker(this.message);

  constructor(
    private readonly root: string,
    private readonly assetId: string,
    private readonly asset: ManifestContainerImageAsset,
    private readonly message: MessageSink) {

    this.localTagName = `cdkasset-${this.assetId}`;
  }

  public async package(): Promise<void> {
    if (await this.docker.exists(this.localTagName)) {
      this.message(`Cached ${this.localTagName}`);
      return;
    }

    const fullPath = path.join(this.root, this.asset.source.directory);
    this.message(`Building Docker image at ${fullPath}`);

    await this.docker.build({
      directory: fullPath,
      tag: this.localTagName,
      buildArgs: this.asset.source.dockerBuildArgs,
      target: this.asset.source.dockerBuildTarget,
      file: this.asset.source.dockerFile,
    });

  }

  public async publish(destinationId: string): Promise<void> {
    if (!this.localTagName) { throw new Error('Call package() first'); }

    const destination = this.asset.destinations[destinationId];

    const ecr = ecrClient({
      region: destination.region,
      assumeRoleArn: destination.assumeRoleArn,
      assumeRoleExternalId: destination.assumeRoleExternalId
    });

    this.message(`Check ${destination.imageUri}`);
    if (await imageExists(ecr, destination.repositoryName, destination.imageTag)) {
      this.message(`Found ${destination.imageUri}`);
      return;
    }

    this.message(`Push ${destination.imageUri}`);
    await this.docker.tag(this.localTagName, destination.imageUri);
    await this.docker.login(ecr);
    await this.docker.push(destination.imageUri);
  }
}

async function imageExists(ecr: AWS.ECR, repositoryName: string, imageTag: string) {
  try {
    await ecr.describeImages({ repositoryName, imageIds: [{ imageTag }] }).promise();
    return true;
  } catch (e) {
    if (e.code !== 'ImageNotFoundException') { throw e; }
    return false;
  }
}