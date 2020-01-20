export enum AssetType {
  /**
   * File asset
   */
  FILE = 'file',

  /**
   * Docker container image asset
   */
  DOCKER_IMAGE = 'docker-image',
}

export enum FileAssetPackaging {
  /**
   * Upload the given path as a file
   */
  FILE = 'file',

  /**
   * The given path is a directory, zip it and upload
   */
  ZIP_DIRECTORY = 'zip',
}

export interface FileSource {
  /**
   * The filesystem object to upload
   */
  readonly path: string;

  /**
   * Packaging method
   *
   * @default FILE
   */
  readonly packaging?: FileAssetPackaging;
}

export interface AwsDestination {
  readonly region: string;
  readonly assumeRoleArn?: string;
  readonly assumeRoleExternalId?: string;
}

export interface FileDestination extends AwsDestination {
  readonly bucketName: string;
  readonly objectKey: string;
}

export interface DockerImageSource {
  readonly directory: string;
  readonly dockerBuildArgs?: Record<string, string>;
  readonly dockerBuildTarget?: string;
  readonly dockerFile?: string;
}

export interface DockerImageDestination extends AwsDestination {
  readonly repositoryName: string;
  readonly imageTag: string;

  /**
   * Full Docker tag coordinates (registry and repository and tag)
   *
   * Example:
   *
   * ```
   * 1234.dkr.ecr.REGION.amazonaws.com/REPO:TAG
   * ```
   */
  readonly imageUri: string;
}