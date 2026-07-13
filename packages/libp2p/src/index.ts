import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { autoNAT } from "@libp2p/autonat";
import { bootstrap } from "@libp2p/bootstrap";
import {
  circuitRelayServer,
  circuitRelayTransport,
} from "@libp2p/circuit-relay-v2";
import { dcutr } from "@libp2p/dcutr";
import { identify } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import { ping } from "@libp2p/ping";
import { tcp } from "@libp2p/tcp";
import { gossipsub } from "@libp2p/gossipsub";
import { webSockets } from "@libp2p/websockets";
import type {
  ConnectionEncrypter,
  PrivateKey,
  StreamMuxerFactory,
} from "@libp2p/interface";
import type { Libp2pOptions } from "libp2p";

export type Libp2pConfig =
  | {
      mode: "CLIENT";
      relayAddress: string;
    }
  | {
      mode: "RELAY";
      publicDns: string;
    };

const baseConfig: {
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
} = {
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

type ExtractServices<
  T extends { services?: Record<string, (...args: any[]) => any> },
> = {
  [K in keyof NonNullable<T["services"]>]: ReturnType<
    NonNullable<T["services"]>[K]
  >;
};

export type BaseServices = ExtractServices<typeof baseConfig>;

const getClientConfig = (relayAddr: string): Partial<Libp2pOptions> => {
  return {
    addresses: {
      listen: ["/p2p-circuit"],
    },
    transports: [webSockets(), circuitRelayTransport()],
    peerDiscovery: [
      bootstrap({
        list: [relayAddr],
      }),
    ],
  };
};

const getServerConfig = (publicDns: string): Partial<Libp2pOptions> => {
  return {
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4002/ws"],
      announce: [
        `/dns4/${publicDns}/tcp/4001`,
        `/dns4/${publicDns}/tcp/443/wss`,
      ],
    },
    transports: [tcp(), webSockets()],
    services: {
      relay: circuitRelayServer({
        reservations: {
          applyDefaultLimit: false,
        },
      }),
      pubsub: gossipsub({
        doPX: true,
      }),
    },
  };
};

export function getLibp2pOptions(
  options: Libp2pConfig,
  privateKey: PrivateKey,
): Libp2pOptions<BaseServices> {
  const modeConfig =
    options.mode === "CLIENT"
      ? getClientConfig(options.relayAddress)
      : getServerConfig(options.publicDns);

  const config = {
    ...baseConfig,
    ...modeConfig,
    services: {
      ...baseConfig.services,
      ...modeConfig.services,
    },
    privateKey,
  };
  return config;
}
