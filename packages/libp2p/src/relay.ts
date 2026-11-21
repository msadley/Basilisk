import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { gossipsub } from "@libp2p/gossipsub";
import type { PrivateKey } from "@libp2p/interface";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import type { Libp2pOptions } from "libp2p";
import { createBaseConfig, type BaseServices } from "./base.js";

export type { BaseServices };

export type RelayServices = BaseServices & {
  relay: ReturnType<ReturnType<typeof circuitRelayServer>>;
};

export function getRelayLibp2pOptions(
  publicDns: string,
  privateKey: PrivateKey,
): Libp2pOptions<RelayServices> {
  const baseConfig = createBaseConfig();
  return {
    ...baseConfig,
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4002/ws"],
      announce: [
        `/dns4/${publicDns}/tcp/4001`,
        `/dns4/${publicDns}/tcp/443/wss`,
      ],
    },
    transports: [tcp(), webSockets()],
    services: {
      ...baseConfig.services,
      relay: circuitRelayServer({
        reservations: {
          applyDefaultLimit: false,
        },
      }),
      pubsub: gossipsub({
        doPX: true,
      }),
    },
    privateKey,
  };
}
