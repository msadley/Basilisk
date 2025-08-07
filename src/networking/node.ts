// src/networking/node.ts

import { kadDHT } from "@libp2p/kad-dht";
import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { getBootstrapAddresses } from "../util/json.js";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { getPrivateKey } from "../util/util.js";
import { webSockets } from "@libp2p/websockets";

/**
 * Represents a libp2p node.
 */
export class Node {
  private node;

  /**
   * Creates a new Node instance.
   * @param {any} nodeInstance - The libp2p node instance.
   * @private
   */
  private constructor(nodeInstance: any) {
    this.node = nodeInstance;
  }

  /**
   * Creates a new libp2p node.
   * @returns {Promise<Node>} A promise that resolves to a new Node instance.
   */
  static async create(): Promise<Node> {
    const nodeInstance = await createLibp2p({
      privateKey: await getPrivateKey(),
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws"],
      },
      transports: [tcp(), webSockets()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        ping: ping(),
        identify: identify(),
        dht: kadDHT({}),
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

  /**
   * Starts the libp2p node.
   */
  start() {
    this.node.start();
  }

  /**
   * Stops the libp2p node.
   */
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
      const latency: number = await this.node.services.ping.ping(
        multiaddr(maString)
      );
      console.log(`Pinged ${maString} in ${latency}ms`);
    } catch (error: any) {
      // throw new Error(`Ping failed: ${error.message}`); //FIXME change this
      console.log("Ping failed: ", error.message);
    }
  }
}
