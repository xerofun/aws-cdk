import * as fs from 'fs';
import * as path from 'path';
import { schema } from './private/manifest-file-schema';
import { DockerImageDestination, DockerImageSource, FileDestination, FileSource } from './types';

/**
 * A manifest of assets
 */
export class AssetManifest {
  /**
   * The default name of the asset manifest in a cdk.out directory
   */
  public static readonly DEFAULT_FILENAME = 'assets.json';

  /**
   * Load an asset manifest from the given file
   */
  public static fromFile(fileName: string) {
    try {
      const obj = validateManifestFile(JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' })));

      return new AssetManifest(path.dirname(fileName), obj.assets);
    } catch (e) {
      throw new Error(`Canot read asset manifest '${fileName}': ${e.message}`);
    }
  }

  /**
   * Load an asset manifest from the given file or directory
   *
   * If the argument given is a directoy, the default asset file name will be used.
   */
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

  private constructor(public readonly directory: string, private readonly _assets: Record<string, schema.GenericAsset>) {
  }

  /**
   * Select a subset of assets and destinations from this manifest.
   *
   * Only assets with at least 1 selected destination are retained.
   *
   * If selection is not given, everything is returned.
   */
  public select(selection?: AssetIdentifier[]): AssetManifest {
    if (selection === undefined) { return this; }

    const ret: Record<string, schema.GenericAsset> = {};
    for (const [assetId, asset] of Object.entries(this._assets)) {
      const filteredDestinations =  filterDict(
        asset.destinations,
        (_, destId) => selection.some(sel => sel.matches(new AssetIdentifier(assetId, destId))));

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
   * Describe the asset manifest as a list of strings
   */
  public list() {
    return Object.entries(this._assets).map(([key, asset]) => `${key} ${asset.type}`);
  }

  /**
   * List of assets, splat out to destinations
   */
  public get entries(): ManifestEntry[] {
    const ret = new Array<ManifestEntry>();
    for (const [assetId, asset] of Object.entries(this._assets)) {
      for (const [destId, destination] of Object.entries(asset.destinations)) {
        const id = new AssetIdentifier(assetId, destId);

        ret.push({
          id,
          type: asset.type,
          source: asset.source,
          destination,
        });
      }
    }
    return ret;
  }
}

/**
 * A single asset from an asset manifest
 *
 * Describes a single (source, destination) pair.
 */
export interface ManifestEntry {
  /**
   * The identifier of the asset
   */
  readonly id: AssetIdentifier;

  /**
   * The type of asset
   */
  readonly type: string;

  /**
   * Properties for how to build the asset.
   *
   * How these properties should be interpreted depends on the asset type.
   */
  readonly source: any;

  /**
   * Properties for where to publish the asset.
   *
   * How these properties should be interpreted depends on the asset type.
   */
  readonly destination: any;
}

export class ManifestDockerImageAsset extends ManifestAsset {
  constructor(id: AssetIdentifier, source: DockerImageSource, destination: DockerImageDestination) {
    super(id, AssetType.DOCKER_IMAGE, source, destination);
  }

  /**
   * Source information for this file asset
   */
  public get dockerSource(): DockerImageSource {
    return this.source;
  }

  /**
   * Destination information for this file asset
   */
  public get dockerDestination(): DockerImageDestination {
    return this.destination;
  }
}

/**
 * Identify an asset in an asset manifest
 */
export class AssetIdentifier {
  /**
   * Parse a ':'-separated string into an asset/destination identifier
   */
  public static fromString(s: string) {
    const parts = s.split(':');
    if (parts.length === 1) { return new AssetIdentifier(parts[0]); }
    if (parts.length === 2) { return new AssetIdentifier(parts[0], parts[1]); }
    throw new Error(`Asset identifier must contain at most 2 ':'-separated parts, got '${s}'`);
  }

  /**
   * Identifies the asset, by source.
   */
  public readonly assetId: string;

  /**
   * Identifies the destination where this asset will be published
   */
  public readonly destinationId?: string;

  constructor(assetId: string, destinationId?: string) {
    this.assetId = assetId;
    this.destinationId = destinationId;
  }

  /**
   * Whether or not this asset identifier matches another one
   *
   * Returns true if both refer to the same asset ID, and the destinations are the
   * same or one of the destinations is unspecified.
   */
  public matches(other: AssetIdentifier) {
    return this.assetId === other.assetId
      && (this.destinationId === undefined || other.destinationId === undefined || this.destinationId === other.destinationId);
  }

  /**
   * Return a string representation for this asset identifier
   */
  public toString() {
    return this.destinationId ? `${this.assetId}:${this.destinationId}` : this.assetId;
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

function validateManifestFile(obj: any): schema.ManifestFile {
  // FIXME: Validate
  return obj;
}
