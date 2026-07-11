import { gossipsub } from "@chainsafe/libp2p-gossipsub";
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
import { webSockets } from "@libp2p/websockets";

import type { Libp2pOptions } from "libp2p";
import type { PrivateKey } from "@libp2p/interface";

export type Libp2pConfig =
  | {
      mode: "CLIENT";
      relayAddress: string;
    }
  | {
      mode: "RELAY";
      publicDns: string;
    };

const baseConfig = {
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

function getClientConfig(relayAddr: string): Partial<Libp2pOptions> {
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
}

function getServerConfig(publicDns: string): Partial<Libp2pOptions> {
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
}

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
  // Unfortunately needed unkown cast
  return config as unknown as Libp2pOptions<BaseServices>;
}
