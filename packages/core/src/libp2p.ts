// packages/core/src/libp2p.ts

import { ping } from "@libp2p/ping";
import { webSockets } from "@libp2p/websockets";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";
import { kadDHT } from "@libp2p/kad-dht";
import { tcp } from "@libp2p/tcp";
import {
  circuitRelayServer,
  circuitRelayTransport,
} from "@libp2p/circuit-relay-v2";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { bootstrap } from "@libp2p/bootstrap";
import type { Libp2pOptions } from "libp2p";

export const bootstrapNodes = process.env.BOOTSTRAP_MULTIADDRS?.split("\n") || [
  "/dns4/your-relay.example.com/tcp/4001/p2p/12D3KooW...",
];
const publicDns = process.env.PUBLIC_DNS || "localhost";

export const baseConfig: Partial<Libp2pOptions> = {
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    ping: ping(),
    dht: kadDHT(),
    identify: identify(),
    autoNAT: autoNAT(),
    dcutr: dcutr(),
  } as any,
};

export const clientConfig: Partial<Libp2pOptions> = {
  addresses: {
    listen: ["/p2p-circuit"],
  },
  transports: [tcp(), webSockets(), circuitRelayTransport()],
  peerDiscovery: [
    bootstrap({
      list: bootstrapNodes,
    }),
  ],
};

export const serverConfig: Partial<Libp2pOptions> = {
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4002/ws"],
    announce: [`/ip4/${publicDns}/tcp/4001`, `/ip4/${publicDns}/tcp/4002/ws`],
  },
  transports: [tcp(), webSockets()],
  services: {
    relay: circuitRelayServer({
      reservations: {
        applyDefaultLimit: false,
      },
    }),
  },
};
