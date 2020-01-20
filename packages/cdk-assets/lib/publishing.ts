import { AssetManifest, ManifestAsset } from "@aws-cdk/assets";
import { makeAssetHandler } from "./handlers";

export interface IPublishProgressListener {
  onAssetStart(event: IPublishProgress): void;
  onAssetEnd(event: IPublishProgress): void;
  onEvent(event: IPublishProgress): void;
  onError(event: IPublishProgress): void;
}

export interface IPublishProgress {
  readonly message: string;
  readonly destination?: ManifestAsset;
  readonly percentComplete: number;

  /**
   * Abort the current publishing operation
   */
  abort(): void;
}

export class AssetPublishing implements IPublishProgress {
  public message: string = 'Starting';
  public destination?: ManifestAsset;
  public readonly failedAssets = new Array<ManifestAsset>();
  private readonly assets: ManifestAsset[];

  private readonly totalOperations: number;
  private completedOperations: number = 0;
  private aborted = false;

  constructor(private readonly manifest: AssetManifest, private readonly listener?: IPublishProgressListener) {
    this.assets = manifest.assets;
    this.totalOperations = this.assets.length;
  }

  public async publish(): Promise<void> {
    for (const asset of this.assets) {
      if (this.aborted) { break; }
      this.destination = asset;

      try {
        if (this.progress('onAssetStart', `Packaging ${asset.id}`)) { break; }

        const handler = makeAssetHandler(this.manifest, asset, m => this.progress('onEvent', m));
        await handler.publish();

        this.completedOperations++;
        if (this.progress('onAssetEnd', `Published ${asset.id}`)) { break; }
      } catch (e) {
        this.failedAssets.push(asset);
        this.completedOperations++;
        if (this.progress('onError', e.message)) { break; }
      }
    }
  }

  public get percentComplete() {
    if (this.totalOperations === 0) { return 100; }
    return Math.floor((this.completedOperations / this.totalOperations) * 100);
  }

  public abort(): void {
    this.aborted = true;
  }

  public get hasFailures() {
    return this.failedAssets.length > 0;
  }

  /**
   * Publish a progress event to the listener, if present.
   *
   * Returns whether an abort is requested. Helper to get rid of repetitive code in publish().
   */
  private progress<E extends keyof IPublishProgressListener >(event: E, message: string): boolean {
    this.message = message;
    if (this.listener) { this.listener[event](this); }
    return this.aborted;
  }
}