import { AssetManifest } from "@aws-cdk/assets";
import { makeAssetHandler } from "./handlers";

export interface IPublishProgressListener {
  onPackageStart(event: IPublishProgress): void;
  onPackageEnd(event: IPublishProgress): void;
  onPublishStart(event: IPublishProgress): void;
  onPublishEnd(event: IPublishProgress): void;
  onEvent(event: IPublishProgress): void;
  onError(event: IPublishProgress): void;
}

export interface IPublishProgress {
  readonly message: string;
  readonly assetId: string;
  readonly assetType: string;
  readonly destinationId?: string;
  readonly percentComplete: number;

  /**
   * Abort the current publishing operation
   */
  abort(): void;
}

export class AssetPublishing implements IPublishProgress {
  public message: string = 'Starting';
  public assetId: string = '';
  public assetType: string = '';
  public destinationId?: string | undefined;
  public readonly failedAssets = new Array<string>();

  private readonly totalOperations: number;
  private completedOperations: number = 0;
  private aborted = false;

  constructor(private readonly manifest: AssetManifest, private readonly listener?: IPublishProgressListener) {
    this.totalOperations = manifest.assetCount + manifest.destinationCount;
  }

  public async publish(): Promise<void> {
    for (const [assetId, asset] of Object.entries(this.manifest.assets)) {
      if (this.aborted) { break; }
      this.assetId = assetId;
      this.assetType = asset.type;
      this.destinationId = undefined;

      try {
        if (this.progress('onPackageStart', `Packaging ${asset.type} ${assetId}`)) { break; }

        const handler = makeAssetHandler(this.manifest, assetId, asset, m => this.progress('onEvent', m));

        await handler.package();
        this.completedOperations++;

        if (this.progress('onPackageEnd', `Packaged ${asset.type} ${assetId}`)) { break; }

        for (const destId of Object.keys(asset.destinations)) {
          if (this.aborted) { break; }
          this.destinationId = destId;

          if (this.progress('onPublishStart', `Publishing ${asset.type} ${assetId} to ${destId}`)) { break; }

          await handler.publish(destId);
          this.completedOperations++;

          if (this.progress('onPublishEnd', `Published ${asset.type} ${assetId} to ${destId}`)) { break; }
        }
      } catch (e) {
        this.failedAssets.push(assetId);
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