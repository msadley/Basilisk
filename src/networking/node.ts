// src/networking/node.ts

import { kadDHT } from "@libp2p/kad-dht";
import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { getBootstrapAddresses, getPrivateKeyRaw } from "../util/json.js";

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
  static async create() {
    const nodeInstance = await createLibp2p({
      privateKey: await getPrivateKeyRaw(),
      addresses: {
        listen: ["/ip4/127.0.0.1/tcp/0"],
      },
      transports: [tcp()],
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
  async start() {
    await (await this.node).start();
  }

  /**
   * Stops the libp2p node.
   */
  async stop() {
    await (await this.node).stop();
  }
}