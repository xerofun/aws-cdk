import * as fs from 'fs';
import { CURRENT_VERSION, ManifestAsset, ManifestContainerImageAsset, ManifestFile, ManifestFileAsset } from './manifest-file';

/**
 * A manifest of assets
 */
export class AssetManifest {
  /**
   * The default name of the asset manifest in a cdk.out directory
   */
  public static DEFAULT_FILENAME = 'assets.json';

  public static isFileAsset(asset: ManifestAsset): asset is ManifestFileAsset {
    return asset.type === 'file';
  }

  public static isContainerImageAsset(asset: ManifestAsset): asset is ManifestContainerImageAsset {
    return asset.type === 'container-image';
  }

  public static fromFile(fileName: string) {
    try {
      const obj = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' })) as ManifestFile;

      if (!obj.version || obj.version !== CURRENT_VERSION) {
        throw new Error(`Unrecognized file version, expected '${CURRENT_VERSION}', got '${obj.version}'`);
      }

      return new AssetManifest(obj.assets);
    } catch (e) {
      throw new Error(`Canot read asset manifest '${fileName}': ${e.message}`);
    }
  }

  constructor(public readonly assets: Record<string, ManifestAsset>) {
  }

  /**
   * Select a subset of assets and destinations from this manifest
   */
  public select(selection: AssetSelection = {}): AssetManifest {
    const ret: Record<string, ManifestAsset> = {};
    for (const [id, asset] of Object.entries(this.assets)) {
      if (selection.ids && !selection.ids.includes(id)) { continue; }

      ret[id] = {
        ...asset,
        destinations: filterDict(asset, (_, dest) => !selection.destinations || selection.destinations.includes(dest))
      };
    }

    return new AssetManifest(ret);
  }

  /**
   * Describe the assets as a list of strings
   */
  public list() {
    return Object.entries(this.assets).map(([key, asset]) => `${key} ${asset.type}`);
  }
}

/**
 * Assets to select
 */
export interface AssetSelection {
  /**
   * Assets ids to select
   *
   * @default - All assets
   */
  readonly ids?: string[];

  /**
   * Asset destinations to select
   *
   * @default - All destinations
   */
  readonly destinations?: string[];
}

function filterDict<A>(xs: Record<string, A>, pred: (x: A, key: string) => boolean): Record<string, A> {
  const ret: Record<string, A> = {};
  for (const [key, value] of Object.entries(xs)) {
    if (pred(value, key)) {
      ret[key] = value;
    }
  }
  return ret;
}