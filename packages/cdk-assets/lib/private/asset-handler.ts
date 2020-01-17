export interface IAssetHandler {
  package(): Promise<void>;
  publish(destinationId: string): Promise<void>;
}

export type MessageSink = (m: string) => void;