import { AssetManifest } from '@aws-cdk/assets';
import * as fs from 'fs-extra';
import * as path from 'path';

export class AssetsOperations {
  public static async fromPath(filePath: string): Promise<AssetsOperations> {
    let st;
    try {
      st = await fs.stat(filePath);
    } catch (e) {
      throw new Error(`Cannot read asset manifest at '${filePath}': ${e.message}`);
    }
    if (st.isDirectory()) {
      return new AssetsOperations(AssetManifest.fromFile(path.join(filePath, AssetManifest.DEFAULT_FILENAME)));
    }
    return new AssetsOperations(AssetManifest.fromFile(filePath));
  }

  constructor(private readonly manifest: AssetManifest) {
  }

  public list() {
    // tslint:disable-next-line:no-console
    console.log(this.manifest.list().join('\n'));
  }

  public publish() {
  }
}