import { AssetIdentifier, AwsDestination, ManifestEntry } from "@aws-cdk/assets";

const FILE_ASSET_TYPE = 'file';

/**
 * Packaging strategy for file assets
 */
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

/**
 * A manifest entry for a file asset
 */
export interface ManifestFileEntry {
  /**
   * Identifier for this asset
   */
  readonly id: AssetIdentifier;

  /**
   * Type of this manifest entry
   */
  readonly type: 'file';

  /**
   * Source of the file asset
   */
  readonly source: FileSource;

  /**
   * Destination for the file asset
   */
  readonly destination: FileDestination;
}

/**
 * Static class so that this is accessible via JSII
 */
export class Manifest {
  public static isFileEntry(entry: ManifestEntry): entry is ManifestFileEntry {
    // FIXME: Validate
    return entry.type === FILE_ASSET_TYPE;
  }
}

/**
 * Describe the source of a file asset
 */
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

/**
 * Where in S3 a file asset needs to be published
 */
export interface FileDestination extends AwsDestination {
  /**
   * The name of the bucket
   */
  readonly bucketName: string;

  /**
   * The destination object key
   */
  readonly objectKey: string;
}
