// apps/relay/src/relay-node.ts

import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p, type Libp2p } from "libp2p";
import { autoNAT } from "@libp2p/autonat";
import { getPrivateKey } from "@basilisk/core";
import type { Multiaddr } from "@multiformats/multiaddr";
import { log } from "@basilisk/utils";

export class Node {
  private node: Libp2p;

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;

    this.node.addEventListener("peer:discovery", (evt) => {
      log("INFO", `Discovered: ${evt.detail.id.toString()}`);
    });

    this.node.addEventListener("connection:open", (evt) => {
      const remoteAddr = evt.detail.remoteAddr.toString();
      log("INFO", `Connection established with: ${remoteAddr}`);
    });
  }

  static async init() {
    await log("INFO", "Initializing node...");

    const announceDns: string = process.env["PUBLIC_DNS"] || "locahost";

    const node = await createLibp2p({
      privateKey: await getPrivateKey(),
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4002/ws"],
        announce: [
          `/dns4/${announceDns}/tcp/4001`,
          `/dns4/${announceDns}/tcp/4002/ws`,
        ],
      },
      transports: [webSockets()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        identify: identify(),
        relay: circuitRelayServer(),
        autoNAT: autoNAT(),
      },
    });
    await log("INFO", "Node initialized.");

    return new Node(node);
  }

  async stop() {
    await log("INFO", "Stopping node...");
    await this.node.stop();
    await log("INFO", "Node stopped.");
  }

  async getMultiAddresses(): Promise<Multiaddr[]> {
    return this.node.getMultiaddrs();
  }
}
