// packages/core/src/node.ts

// Libp2p-related imports
import { createLibp2p, type Libp2p, type Libp2pOptions } from "libp2p";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import type { Stream } from "@libp2p/interface";

//Misc imports
import { EventEmitter } from "events";
import map from "it-map";
import { pipe } from "it-pipe";
import drain from "it-drain";
import * as lp from "it-length-prefixed";
import { toString } from "uint8arrays/to-string";
import type { Message } from "./database.js";

// Local packages imports
import { getPrivateKey } from "./keys.js";
import { log } from "@basilisk/utils";
import { validateConfigFile } from "./config.js";
import { clientConfig, serverConfig, baseConfig } from "./libp2p.js";
import { Connection } from "./connection.js";

export const chatEvents = new EventEmitter();

export class Node {
  private node: Libp2p;
  private chatConnections: Map<string, Connection> = new Map();

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;

    this.node.addEventListener("connection:close", (evt) => {
      const remoteAddr = evt.detail.remoteAddr;
      this.chatConnections.delete(remoteAddr.toString());
    });
  }

  static async init(mode: "CLIENT" | "RELAY"): Promise<Node> {
    await log("INFO", "Initializing node...");

    await validateConfigFile();

    const modeConfig = mode === "CLIENT" ? clientConfig : serverConfig;

    const config: Libp2pOptions = {
      ...baseConfig,
      ...modeConfig,
      services: {
        ...baseConfig.services,
        ...modeConfig.services,
      },
      privateKey: await getPrivateKey(),
      start: false,
    };

    const node = await createLibp2p(config);
    const basiliskNode = new Node(node);

    await log("INFO", "Creating chat protocol...");
    await node.handle("/chat/1.0.0", async ({ stream, connection }) => {
      await log(
        "INFO",
        `Chat stream opened with ${connection.remoteAddr.toString()}`
      );
      await basiliskNode.retrieveMessageFromStream(
        stream,
        connection.remoteAddr
      );
    });
    await log("INFO", "Chat protocol created.");

    await node.start();
    await log("INFO", "Node initialized.");

    return basiliskNode;
  }

  async stop() {
    await log("INFO", "Stopping node...");
    this.node.stop();
    await log("INFO", "Node stopped.");
  }

  getId(): string {
    return this.node.peerId.toString();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  async pingTest(addr: string): Promise<number> {
    const pingService = this.node.services.ping as {
      ping: (addr: Multiaddr) => Promise<number>;
    };
    const latency: number = await pingService.ping(multiaddr(addr));
    await log("INFO", `Pinged ${addr.toString()} in ${latency}ms`);
    return latency;
  }

  async createChatConnection(addr: string) {
    await log("INFO", `Creating chat connection with ${addr}...`);
    const stream: Stream = await this.node.dialProtocol(
      multiaddr(addr),
      "/chat/1.0.0"
    );
    const connection = new Connection(stream);
    this.chatConnections.set(addr, connection);
    await log("INFO", `Chat connection created with ${addr}.`);
  }

  async closeChatStream(addr: string) {
    await log("INFO", `Closing chat connection with ${addr}...`);
    this.chatConnections.delete(addr);
    await log("INFO", `Closed chat connection with ${addr}.`);
  }

  async sendMessage(message: Message) {
    await log("INFO", `Sending message to ${message.to}`);
    const addr = multiaddr(message.to);
    if (!this.chatConnections.get(addr.toString())) {
      await this.createChatConnection(message.to);
    }
    const connection = this.chatConnections.get(addr.toString());
    if (!connection) {
      throw new Error(
        `Failed to create or retrieve chat connection for ${message.to}`
      );
    }
    connection.sendMessage(message);
    await log("INFO", `Message sent to ${message.to}.`);
  }

  async retrieveMessageFromStream(stream: Stream, sender: Multiaddr) {
    try {
      await pipe(
        stream.source,
        (source) => lp.decode(source),
        (source) => map(source, (buffer) => toString(buffer.subarray())),
        (source) => map(source, (string) => JSON.parse(string)),
        (source) =>
          map(source, (message: Message) => {
            chatEvents.emit("message:receive", message, sender);
          }),
        drain
      );
      await log("INFO", `Stream from ${sender} processed successfully.`);
    } catch (err: any) {
      await log(
        "ERROR",
        `Error processing stream from ${sender}: ${err.message}`
      );
    } finally {
      stream.close();
    }
  }
}
