// src/networking/node.ts

import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { type Multiaddr } from "@multiformats/multiaddr";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { getPrivateKey } from "../util/util.js";
import { webSockets } from "@libp2p/websockets";
import { log } from "../util/log.js";

const bootstrapNodes = [
  // Some public available nodes for managing discovery and NAT hole-punching
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa", // Community server
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt", // Community server
];

export class Node {
  private node: Libp2p;

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;

    this.node.addEventListener("peer:discovery", async (evt) => {
      await log("INFO", `Discovered: ${evt.detail.id.toString()}`);
    });

    this.node.addEventListener("connection:open", async (evt) => {
      const remoteAddr = evt.detail.remoteAddr.toString();
      await log("INFO", `Connection established with: ${remoteAddr}`);

      // Check if the connection is relayed
      if (remoteAddr.includes("p2p-circuit")) {
        await log("INFO", "Connection is being relayed. Waiting for hole punch...");
      } else {
        await log("INFO", "Connection is now direct");
      }
    });
  }

  static async create(): Promise<Node> {
    const nodeInstance = await createLibp2p({
      privateKey: await getPrivateKey(),
      addresses: {
        listen: [
          // "/ip4/0.0.0.0/tcp/0", Disabled for testing
          "/ip4/0.0.0.0/tcp/0/wss", 
          "/p2p-circuit"],
      },
      transports: [tcp(), webSockets(), circuitRelayTransport()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        ping: ping(),
        identify: identify(),
      },
      peerDiscovery: [
        bootstrap({
          list: bootstrapNodes,
        }),
      ],
      start: false,
    });
    return new Node(nodeInstance);
  }

  start() {
    this.node.start();
  }

  stop() {
    this.node.stop();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  printAddresses(): string[] {
    const multiaddrs = this.getMultiaddrs();
    return multiaddrs.map((addr: Multiaddr) => addr.toString());
  }

  async pingTest(multiAddress: Multiaddr): Promise<string> {
    const pingService = this.node.services.ping as {
      ping: (addr: Multiaddr) => Promise<number>;
    };
    const latency: number = await pingService.ping(multiAddress);
    return `Pinged ${multiAddress.toString()} in ${latency}ms`;
  }

  async dial(multiAddress: Multiaddr) {
    try {
      await this.node.dial(multiAddress);
      console.log("Dial successful!");
    } catch (err) {
      console.error("Dial failed:", err);
    }
  }
}
