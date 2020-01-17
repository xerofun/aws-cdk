import * as fs from 'fs';
import * as path from 'path';
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

      return new AssetManifest(path.dirname(fileName), obj.assets);
    } catch (e) {
      throw new Error(`Canot read asset manifest '${fileName}': ${e.message}`);
    }
  }

  public static fromPath(filePath: string) {
    let st;
    try {
      st = fs.statSync(filePath);
    } catch (e) {
      throw new Error(`Cannot read asset manifest at '${filePath}': ${e.message}`);
    }
    if (st.isDirectory()) {
      return AssetManifest.fromFile(path.join(filePath, AssetManifest.DEFAULT_FILENAME));
    }
    return AssetManifest.fromFile(filePath);
  }

  constructor(public readonly directory: string, public readonly assets: Record<string, ManifestAsset>) {
  }

  /**
   * Select a subset of assets and destinations from this manifest.
   *
   * Only assets with at least 1 selected destination are retained.
   *
   * If selection is not given, everything is returned.
   */
  public select(selection?: DestinationIdentifier[]): AssetManifest {
    if (selection === undefined) { return this; }

    const ret: Record<string, ManifestAsset> = {};
    for (const [assetId, asset] of Object.entries(this.assets)) {
      const filteredDestinations =  filterDict(asset.destinations, (_, destId) => selection.some(sel => sel.matches(assetId, destId)));

      if (Object.keys(filteredDestinations).length > 0) {
        ret[assetId] = {
          ...asset,
          destinations: filteredDestinations,
        };
      }
    }

    return new AssetManifest(this.directory, ret);
  }

  /**
   * Describe the assets as a list of strings
   */
  public list() {
    return Object.entries(this.assets).map(([key, asset]) => `${key} ${asset.type}`);
  }

  public get assetCount() {
    return Object.keys(this.assets).length;
  }

  public get destinationCount() {
    return sum(Object.values(this.assets).map(asset => Object.keys(asset.destinations).length));
  }
}

/**
 * Identify an asset (and/or a destination) in an asset manifest
 */
export class DestinationIdentifier {
  /**
   * Parse a ':'-separated string into an asset/destination identifier
   */
  public static fromString(s: string) {
    const parts = s.split(':');
    if (parts.length === 1) { return new DestinationIdentifier(parts[0]); }
    if (parts.length === 2) { return new DestinationIdentifier(parts[0], parts[1]); }
    throw new Error(`Asset identifier must contain at most 2 ':'-separated parts, got '${s}'`);
  }

  constructor(public readonly assetId: string, public readonly destinationId?: string) {
  }

  public matches(assetId: string, destinationId: string) {
    return this.assetId === assetId && (this.destinationId === undefined || this.destinationId === destinationId);
  }
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

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}