import { AssetManifest, ManifestAsset, ManifestDockerImageAsset, ManifestFileAsset } from "@aws-cdk/assets";
import { IAssetHandler, MessageSink } from "../private/asset-handler";
import { ContainerImageAssetHandler } from "./container-images";
import { FileAssetHandler } from "./files";

export function makeAssetHandler(manifest: AssetManifest, asset: ManifestAsset, message: MessageSink): IAssetHandler {
  if (asset instanceof ManifestFileAsset) {
    return new FileAssetHandler(manifest.directory, asset, message);
  }
  if (asset instanceof ManifestDockerImageAsset) {
    return new ContainerImageAssetHandler(manifest.directory, asset, message);
  }

  throw new Error(`Unrecognized asset type '${asset.type}' in ${JSON.stringify(asset)})`);
}