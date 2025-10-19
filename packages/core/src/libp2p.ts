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
import { log } from "@basilisk/utils";

export const bootstrapNodes = process.env.BOOTSTRAP_MULTIADDRS?.split("\n") || [
  "/ip4/<IP>/tcp/4001/p2p/12D3KooW...",
];

async function getMyIp(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = (await response.json()) as { ip: string };
    const myIp = data.ip;

    await log("INFO", `Got public ip: ${myIp}`);
    return myIp;
  } catch (err) {
    await log("ERROR", `Failed to get IP: ${err}`);
    throw new Error("Failed to get IP");
  }
}

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
    announce: [`/ip4/${getMyIp()}/tcp/4001`, `/ip4/${getMyIp()}/tcp/4002/ws`],
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
