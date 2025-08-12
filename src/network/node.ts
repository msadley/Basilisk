// src/networking/node.ts

import { kadDHT } from "@libp2p/kad-dht";
import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { getBootstrapAddresses } from "../util/json.js";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { getPrivateKey } from "../util/util.js";
import { webSockets } from "@libp2p/websockets";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";

export class Node {
  private node: Libp2p;

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;
    // Event listener for when the node finds a new peer
    this.node.addEventListener("peer:discovery", (evt) => {
      console.log("Discovered:", evt.detail.id.toString());
    });

    // Event listener for when a connection is established
    this.node.addEventListener("connection:open", (evt) => {
      const remoteAddr = evt.detail.remoteAddr.toString();
      console.log(`Connection established with: ${remoteAddr}`);

      // Check if the connection is relayed
      if (remoteAddr.includes("p2p-circuit")) {
        console.log(
          "✅ SUCCESS: Connection is being relayed. Waiting for hole punch..."
        );
      } else {
        console.log("✨ UPGRADE COMPLETE: Connection is now direct!");
      }
    });

    this.node.addEventListener("self:peer:update", () => {
      this.printAddresses();
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
        dht: kadDHT({}),
        autoNAT: autoNAT(),
        dcutr: dcutr(),
      },
      peerDiscovery: [
        bootstrap({
          list: await getBootstrapAddresses(),
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
