/**
 * Current version of the manifest definition
 */
export const CURRENT_VERSION = 'assets-1.0';

/**
 * Definitions for the asset manifest
 */
export interface ManifestSchema {
  /**
   * Version of the manifest
   */
  readonly version: string;

  /**
   * The assets in this manifest
   */
  readonly assets: Record<string, AssetSchema>;
}

export type AssetSchema = FileAssetSchema | ContainerImageAssetSchema | GenericAssetSchema;

export interface GenericAssetSchema {
  /**
   * Type of the asset
   *
   * Files and container images are recognized by default, other asset types
   * depend on the tool that is interpreting the manifest.
   */
  readonly type: string;

  /**
   * Type-dependent description of the asset source
   */
  readonly source: any;

  /**
   * Type-dependent description of the asset destination
   */
  readonly destinations: Record<string, any>;
}

export interface FileAssetSchema {
  readonly type: 'file';
  readonly source: FileAssetSourceSchema;
  readonly destinations: Record<string, FileAssetDestinationSchema>;
}

export interface FileAssetSourceSchema {
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

export interface AwsDestinationSchema {
  readonly region: string;
  readonly assumeRoleArn?: string;
  readonly assumeRoleExternalId?: string;
}

export interface FileAssetDestinationSchema extends AwsDestinationSchema {
  readonly bucketName: string;
  readonly objectKey: string;
}

export interface ContainerImageAssetSchema {
  readonly type: 'container-image';
  readonly source: ContainerImageAssetSourceSchema;
  readonly destinations: Record<string, ContainerImageAssetDestinationSchema>;
}

export interface ContainerImageAssetSourceSchema {
  readonly directory: string;
  readonly dockerBuildArgs?: Record<string, string>;
  readonly dockerBuildTarget?: string;
  readonly dockerFile?: string;
}

export interface ContainerImageAssetDestinationSchema extends AwsDestinationSchema {
  readonly repositoryName: string;
  readonly imageTag: string;
}