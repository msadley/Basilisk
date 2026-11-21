import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";
import { gossipsub } from "@libp2p/gossipsub";
import { identify } from "@libp2p/identify";
import type {
  ConnectionEncrypter,
  StreamMuxerFactory,
} from "@libp2p/interface";
import { kadDHT } from "@libp2p/kad-dht";
import { ping } from "@libp2p/ping";

type BaseConfigShape = {
  start: false;
  connectionEncrypters: Array<(components: any) => ConnectionEncrypter>;
  streamMuxers: Array<(components: any) => StreamMuxerFactory>;
  services: {
    pubsub: ReturnType<typeof gossipsub>;
    ping: ReturnType<typeof ping>;
    dht: ReturnType<typeof kadDHT>;
    identify: ReturnType<typeof identify>;
    autoNAT: ReturnType<typeof autoNAT>;
    dcutr: ReturnType<typeof dcutr>;
  };
};

export function createBaseConfig(): BaseConfigShape {
  return {
    start: false,
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub(),
      ping: ping(),
      dht: kadDHT(),
      identify: identify(),
      autoNAT: autoNAT(),
      dcutr: dcutr(),
    },
  };
}

type ExtractServices<
  T extends { services?: Record<string, (...args: any[]) => any> },
> = {
  [K in keyof NonNullable<T["services"]>]: ReturnType<
    NonNullable<T["services"]>[K]
  >;
};

export type BaseServices = ExtractServices<BaseConfigShape>;
