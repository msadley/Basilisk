// src/networking/node-handling.ts

// Networking imports
import { kadDHT } from "@libp2p/kad-dht";
import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";

// Local imports
import { CONFIG_FILE } from "../app/app.js";
import { getBootstrapAddresses, getPrivateKeyRaw } from "../util/json.js";

export class Node {
  private node;

  private constructor(nodeInstance: any) {
    this.node = nodeInstance;
  }

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

  async start() {
    await (await this.node).start();
  }

  async stop() {
    await (await this.node).stop();
  }
}
