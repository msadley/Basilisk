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
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { getAppKeyPair } from "./keys.js";

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

export function getClientConfig(
  bootstrapNodes: string[]
): Partial<Libp2pOptions> {
  return {
    addresses: {
      listen: ["/p2p-circuit"],
    },
    transports: [webSockets(), circuitRelayTransport()],
    peerDiscovery: [
      bootstrap({
        list: bootstrapNodes,
      }),
    ],
  };
}

export function getServerConfig(publicDns: string): Partial<Libp2pOptions> {
  return {
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4002/ws"],
      announce: [
        `/dns4/${publicDns}/tcp/4001`,
        `/dns4/${publicDns}/tcp/4002/ws`,
      ],
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
}

export async function getLibp2pOptions(
  options:
    | {
        mode: "CLIENT";
        bootstrapNodes: string[];
      }
    | { mode: "RELAY"; publicDns: string }
): Promise<Libp2pOptions> {
  const modeConfig =
    options.mode === "CLIENT"
      ? getClientConfig(options.bootstrapNodes)
      : getServerConfig(options.publicDns);
  const privateKey = await getAppKeyPair();
  const peerId = await peerIdFromPrivateKey(privateKey);
  return {
    ...baseConfig,
    ...modeConfig,
    services: {
      ...baseConfig.services,
      ...modeConfig.services,
    },
    peerId,
    start: false,
  } as any;
}
