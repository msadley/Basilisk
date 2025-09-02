// packages/core/src/node.ts

// Libp2p-related imports
import { createLibp2p, type Libp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { bootstrap } from "@libp2p/bootstrap";
import { type Multiaddr } from "@multiformats/multiaddr";
import type { Connection, PeerId, Stream } from "@libp2p/interface";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { ping } from "@libp2p/ping";
import { webSockets } from "@libp2p/websockets";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";

// Local packages imports
import { getPrivateKey } from "./keys.js";
import { log } from "@basilisk/utils";
import { validateConfigFile } from "./config.js";
import { stdinToStream, streamToConsole } from "./stream.js";

export class Node {
  private node: Libp2p;

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;

    /*this.node.addEventListener("peer:discovery", (evt) => {
      log("INFO", `Discovered: ${evt.detail.id.toString()}`);
    });
    */

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
      transports: [webSockets(), circuitRelayTransport()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        ping: ping(),
        identify: identify(),
        autoNAT: autoNAT(),
        dcutr: dcutr(),
      },
      peerDiscovery: [
        bootstrap({
          list: process.env.BOOTSTRAP_MULTIADDRS?.split("\n") || [
            "/dns4/your-relay.example.com/tcp/4001/p2p/12D3KooW...",
          ],
        }),
      ],
      start: true,
    });

    await log("INFO", "Creating chat protocol...");
    await nodeInstance.handle("/chat/0.1.0", async ({ stream }) => {
      stdinToStream(stream);
      streamToConsole(stream);
    });
    await log("INFO", "Chat protocol created.");

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

  getConnections(peerId: PeerId): Connection[] {
    return this.node.getConnections(peerId);
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

  async startChatStream(ma: Multiaddr): Promise<Stream> {
    return await this.node.dialProtocol(ma, "chat/0.1.0");
  }

  async dial(multiAddress: Multiaddr): Promise<Connection> {
    await log("INFO", `Dialing ${multiAddress.toString()}...`);
    try {
      const conn = await this.node.dial(multiAddress);
      await log("INFO", `Succesfully dialed ${multiAddress.toString()}`);
      return conn;
    } catch (err) {
      throw new Error("Dial failed: " + err);
    }
  }
}
