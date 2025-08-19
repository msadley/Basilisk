// packages/core/src/node.ts

import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { type Multiaddr } from "@multiformats/multiaddr";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { getPrivateKey } from "./keys.js";
import { webSockets } from "@libp2p/websockets";
import { log } from "@basilisk/utils";
import { validateConfigFile } from "./config.js";

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

  static async init(): Promise<Node> {
    await log("INFO", "Initializing node...");

    await validateConfigFile();

    const nodeInstance = await createLibp2p({
      privateKey: await getPrivateKey(),
      addresses: {
        listen: ["/p2p-circuit"],
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
          list: process.env.BOOTSTRAP_MULTIADDR?.split("|") || [
            "/dns4/your-relay.example.com/tcp/4001/p2p/12D3KooW...",
          ],
        }),
      ],
      start: true,
    });
    await log("INFO", "Node initialized.");
    return new Node(nodeInstance);
  }

  async stop() {
    await log("INFO", "Stopping node...");
    this.node.stop();
    await log("INFO", "Node stopped.");
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
