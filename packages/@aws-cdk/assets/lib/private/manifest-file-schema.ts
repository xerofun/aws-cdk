import { AssetType, DockerImageDestination, DockerImageSource, FileDestination, FileSource } from "../types";

// NOTE: typescript-json-schema does not support Record<K, V>
// https://github.com/YousefED/typescript-json-schema/issues/337

export namespace schema {

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
    readonly version: 'assets-1.0';

    /**
     * The assets in this manifest
     */
    readonly assets: {[key: string]: Asset};
  }

  export type Asset = ManifestFileAsset | ManifestDockerImageAsset | GenericAsset;

  export interface GenericAsset {
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
    readonly destinations: {[key: string]: any};
  }

  export interface ManifestFileAsset {
    readonly type: AssetType.FILE;
    readonly source: FileSource;
    readonly destinations: {[key: string]: FileDestination};
  }

  export function isFileAsset(asset: GenericAsset): asset is ManifestFileAsset {
    return asset.type === AssetType.FILE;
  }

  export function isDockerImageAsset(asset: GenericAsset): asset is ManifestDockerImageAsset {
    return asset.type === AssetType.DOCKER_IMAGE;
  }

  export interface ManifestDockerImageAsset {
    readonly type: AssetType.DOCKER_IMAGE;
    readonly source: DockerImageSource;
    readonly destinations: {[key: string]: DockerImageDestination};
  }

}