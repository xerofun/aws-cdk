import * as fs from 'fs';
import { Schema, Validator } from 'jsonschema';
import * as path from 'path';
import { schema } from './private/manifest-file-schema';
import { AssetType, DockerImageDestination, DockerImageSource, FileDestination, FileSource } from './types';

/**
 * A manifest of assets
 */
export class AssetManifest {
  /**
   * The default name of the asset manifest in a cdk.out directory
   */
  public static readonly DEFAULT_FILENAME = 'assets.json';

  public static fromFile(fileName: string) {
    try {
      const obj = validateManifestFile(JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' })));

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
    return Object.entries(this._assets).map(([key, asset]) => `${key} ${asset.type}`);
  }

  /**
   * Assets primarily organized by destinations
   */
  public get assets(): ManifestAsset[] {
    const ret = new Array<ManifestAsset>();
    for (const [assetId, asset] of Object.entries(this._assets)) {
      for (const [destId, dest] of Object.entries(asset.destinations)) {
        const id = new AssetIdentifier(assetId, destId);

        if (schema.isFileAsset(asset)) {
          ret.push(new ManifestFileAsset(id, asset.source, dest));
        } else if (schema.isDockerImageAsset(asset)) {
          ret.push(new ManifestDockerImageAsset(id, asset.source, dest));
        } else {
          ret.push(new ManifestAsset(id, asset.type, asset.source, dest));
        }
      }
    }
    return ret;
  }
}

export class ManifestAsset {
  /**
   * The identifier of the asset
   */
  public readonly id: AssetIdentifier;

  /**
   * The type of asset
   */
  public readonly type: string;

  constructor(id: AssetIdentifier, type: string, public readonly source: any, public readonly destination: any) {
    this.id = id;
    this.type = type;
  }

  public isFileAsset(): this is ManifestFileAsset {
    return this instanceof ManifestFileAsset;
  }

  public isDockerImageAsset(): this is ManifestDockerImageAsset {
    return this instanceof ManifestDockerImageAsset;
  }
}

export class ManifestFileAsset extends ManifestAsset {
  constructor(id: AssetIdentifier, source: FileSource, destination: FileDestination) {
    super(id, AssetType.FILE, source, destination);
  }

  /**
   * Source information for this file asset
   */
  public get fileSource(): FileSource {
    return this.source;
  }

  /**
   * Destination information for this file asset
   */
  public get fileDestination(): FileDestination {
    return this.destination;
  }
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
 * Identify an asset (and/or a destination) in an asset manifest
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

  constructor(public readonly assetId: string, public readonly destinationId?: string) {
  }

  public matches(assetId: string, destinationId: string) {
    return this.assetId === assetId && (this.destinationId === undefined || this.destinationId === destinationId);
  }

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

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires

export function validateManifestFile(obj: any): schema.ManifestFile {
  const fileSchema: Schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schema', 'manifest.schema.json'), { encoding: 'utf-8' }));
  const validator = new Validator();
  validator.addSchema(fileSchema); // For definitions
  const result = validator.validate(obj, fileSchema, { nestedErrors: true } as any);
  if (result.valid) { return obj; }
  throw new Error(`Invalid Asset Manifest:\n${result}`);
}
