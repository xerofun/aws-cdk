import * as fs from 'fs';
import { CURRENT_VERSION, ManifestSchema } from './private/manifest';

/**
 * A manifest of assets
 */
export class AssetManifest {
  private readonly manifest: ManifestSchema;

  constructor(fileName: string) {
    try {
      const obj = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' })) as ManifestSchema;

      if (!obj.version || obj.version !== CURRENT_VERSION) {
        throw new Error(`Unrecognized file version, expected '${CURRENT_VERSION}', got '${obj.version}'`);
      }

      this.manifest = obj;
    } catch (e) {
      throw new Error(`Error reading asset manifest ${fileName}: ${e}`);
    }
  }

  /**
   * Select assets and destinations from this manifest
   */
  public select() {
  }
}

/**
 * Assets to select
 */
export interface AssetSelection {
  /**
   * Assets ids to select
   *
   * @default All assets
   */
  ids?: string[];

  destinations?:
}