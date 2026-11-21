import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import type { PrivateKey } from "@libp2p/interface";
import { webSockets } from "@libp2p/websockets";
import type { Libp2pOptions } from "libp2p";
import { createBaseConfig, type BaseServices } from "./base.js";

export type { BaseServices };

export function getClientLibp2pOptions(
  relayAddress: string,
  privateKey: PrivateKey,
): Libp2pOptions<BaseServices> {
  const baseConfig = createBaseConfig();
  return {
    ...baseConfig,
    addresses: {
      listen: ["/p2p-circuit"],
    },
    transports: [webSockets(), circuitRelayTransport()],
    peerDiscovery: [
      bootstrap({
        list: [relayAddress],
      }),
    ],
    privateKey,
  };
}
