/**
 * Current version of the manifest definition
 */
export const CURRENT_VERSION = 'assets-1.0';

/**
 * Definitions for the asset manifest
 */
export interface ManifestFile {
  /**
   * Version of the manifest
   */
  readonly version: string;

  /**
   * The assets in this manifest
   */
  readonly assets: Record<string, ManifestAsset>;
}

export interface ManifestAsset {
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

export interface ManifestFileAsset {
  readonly type: 'file';
  readonly source: ManifestFileAssetSource;
  readonly destinations: Record<string, ManifestFileAssetDestination>;
}

export interface ManifestFileAssetSource {
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

interface AwsDestinationSchema {
  readonly region: string;
  readonly assumeRoleArn?: string;
  readonly assumeRoleExternalId?: string;
}

export interface ManifestFileAssetDestination extends AwsDestinationSchema {
  readonly bucketName: string;
  readonly objectKey: string;
}

export interface ManifestContainerImageAsset {
  readonly type: 'container-image';
  readonly source: ManifestContainerImageAssetSource;
  readonly destinations: Record<string, ManifestContainerImageAssetDestination>;
}

export interface ManifestContainerImageAssetSource {
  readonly directory: string;
  readonly dockerBuildArgs?: Record<string, string>;
  readonly dockerBuildTarget?: string;
  readonly dockerFile?: string;
}

export interface ManifestContainerImageAssetDestination extends AwsDestinationSchema {
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