import { AssetManifest, ManifestAsset } from "@aws-cdk/assets";
import { IAssetHandler, MessageSink } from "../private/asset-handler";
import { ContainerImageAssetHandler } from "./container-images";
import { FileAssetHandler } from "./files";

export function makeAssetHandler(manifest: AssetManifest, assetId: string, asset: ManifestAsset, message: MessageSink): IAssetHandler {
  if (AssetManifest.isFileAsset(asset)) {
    return new FileAssetHandler(manifest.directory, assetId, asset, message);
  }
  if (AssetManifest.isContainerImageAsset(asset)) {
    return new ContainerImageAssetHandler(manifest.directory, assetId, asset, message);
  }

  throw new Error(`Unrecognized asset type '${asset.type}' in ${JSON.stringify(asset)})`);
}