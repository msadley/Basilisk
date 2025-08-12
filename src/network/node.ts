// src/networking/node.ts

import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { getPrivateKey } from "../util/util.js";
import { webSockets } from "@libp2p/websockets";
import { log } from "../util/log.js";

const bootstrapNodes = [
  // Some public available nodes for managing discovery and NAT hole-punching
  "/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
];

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

      // Check if the connection is relayed
      if (remoteAddr.includes("p2p-circuit")) {
        log("INFO", "Connection is being relayed. Waiting for hole punch...");
      } else {
        log("INFO", "Connection is now direct");
      }
    });
  }

  static async create(): Promise<Node> {
    const nodeInstance = await createLibp2p({
      privateKey: await getPrivateKey(),
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws", "/p2p-circuit"],
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

  async pingTest(maString: string) {
    try {
      const pingService = this.node.services.ping as {
        ping: (addr: Multiaddr) => Promise<number>;
      };
      const latency: number = await pingService.ping(multiaddr(maString));
      console.log(`Pinged ${maString} in ${latency}ms`);
    } catch (error: any) {
      console.log("Ping failed: ", error.message);
    }
  }

  async dial(ma: string) {
    try {
      await this.node.dial(multiaddr(ma));
      console.log("Dial successful!");
    } catch (err) {
      console.error("Dial failed:", err);
    }
  }
}
