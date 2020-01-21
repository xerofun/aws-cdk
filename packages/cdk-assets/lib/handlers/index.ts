import { AssetManifest, ManifestAsset, ManifestDockerImageAsset, ManifestFileAsset } from "@aws-cdk/assets";
import { IAws } from "../aws-operations";
import { IAssetHandler, MessageSink } from "../private/asset-handler";
import { ContainerImageAssetHandler } from "./container-images";
import { FileAssetHandler } from "./files";

export function makeAssetHandler(manifest: AssetManifest, asset: ManifestAsset, aws: IAws, message: MessageSink): IAssetHandler {
  if (asset instanceof ManifestFileAsset) {
    return new FileAssetHandler(manifest.directory, asset, aws, message);
  }
  if (asset instanceof ManifestDockerImageAsset) {
    return new ContainerImageAssetHandler(manifest.directory, asset, aws, message);
  }

  throw new Error(`Unrecognized asset type '${asset.type}' in ${JSON.stringify(asset)})`);
}