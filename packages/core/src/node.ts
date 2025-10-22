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
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";

// Local packages imports
import { getPrivateKey } from "./profile/keys.js";
import { getPeerId, multiaddrFromPeerId } from "./peerId.js";
import { validateConfigFile } from "./profile/config.js";
import {
  clientConfig,
  serverConfig,
  baseConfig,
  bootstrapNodes,
} from "./libp2p.js";
import { Connection } from "./connection.js";
import type { MessagePacket, Profile } from "./types.js";
import { getProfile, setId } from "./profile/profile.js";

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
    console.log("INFO", "Initializing node...");

    if (mode === "CLIENT") {
      console.log(
        "INFO",
        `Using bootstrap nodes: ${bootstrapNodes.join(", ")}`
      );

      await validateConfigFile();
    }

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

    if (mode === "CLIENT") {
      console.log("INFO", "Creating chat protocol...");
      await node.handle("/chat/1.0.0", async ({ stream, connection }) => {
        console.log(
          "INFO",
          `Chat stream opened with ${connection.remoteAddr.toString()}`
        );
        await basiliskNode.retrieveMessageFromStream(
          stream,
          getPeerId(connection.remoteAddr)
        );
      });
      console.log("INFO", "Chat protocol created.");

      console.log("INFO", "Creating info protocol...");
      await node.handle("/info/1.0.0", async ({ stream, connection }) => {
        console.log(
          "INFO",
          `Info stream opened with ${connection.remoteAddr.toString()}`
        );
        await basiliskNode.sendInfoToStream(
          stream,
          getPeerId(connection.remoteAddr)
        );
      });
      console.log("INFO", "Info protocol created.");
    }

    await node.start();
    await setId(node.peerId.toString());

    console.log("INFO", "Node initialized.");

    return basiliskNode;
  }

  async stop() {
    console.log("INFO", "Stopping node...");
    this.node.stop();
    console.log("INFO", "Node stopped.");
  }

  getId(): string {
    return this.node.peerId.toString();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  async getProfile(): Promise<Profile> {
    return await getProfile();
  }

  async pingTest(addr: string): Promise<number> {
    const pingService = this.node.services.ping as {
      ping: (addr: Multiaddr) => Promise<number>;
    };
    const latency: number = await pingService.ping(multiaddr(addr));
    console.log("INFO", `Pinged ${addr.toString()} in ${latency}ms`);
    return latency;
  }

  async createChatConnection(peerId: string) {
    console.log("INFO", `Creating chat connection with ${peerId}...`);
    try {
      const stream: Stream = await this.node.dialProtocol(
        multiaddrFromPeerId(bootstrapNodes[0], peerId),
        "/chat/1.0.0"
      );
      const connection = new Connection(stream);
      this.chatConnections.set(peerId, connection);
      console.log("INFO", `Chat connection created with ${peerId}.`);
    } catch (error: any) {
      console.log(
        "ERROR",
        "Failed to create chat connection: " + error.message
      );
    }
  }

  async getPeerProfile(peerId: string): Promise<Profile> {
    console.log("INFO", `Requesting profile from ${peerId}...`);
    const stream = await this.node.dialProtocol(
      multiaddrFromPeerId(bootstrapNodes[0], peerId),
      "/info/1.0.0"
    );

    const response = await pipe(
      [],
      stream,
      (source) => lp.decode(source),
      (source) => map(source, (buf) => toString(buf.subarray())),
      async function (source) {
        for await (const msg of source) {
          return JSON.parse(msg) as Profile;
        }
        throw new Error("Stream ended without a response");
      }
    );
    console.log("INFO", `Profile received from ${peerId}`);
    return response;
  }

  async closeChatStream(id: string) {
    console.log("INFO", `Closing chat connection with ${id}...`);
    this.chatConnections.delete(id);
    console.log("INFO", `Closed chat connection with ${id}.`);
  }

  async sendMessage(message: MessagePacket) {
    console.log("INFO", `Sending message to ${message.to}`);
    if (!this.chatConnections.get(message.to)) {
      await this.createChatConnection(message.to);
    }
    const connection = this.chatConnections.get(message.to);
    if (!connection) {
      throw new Error(
        `Failed to create or retrieve chat connection for ${message.to}`
      );
    }
    connection.sendMessage(message);
    console.log("INFO", `Message sent to ${message.to}.`);
  }

  async retrieveMessageFromStream(stream: Stream, peerId: string) {
    try {
      await pipe(
        stream.source,
        (source) => lp.decode(source),
        (source) => map(source, (buffer) => toString(buffer.subarray())),
        (source) => map(source, (string) => JSON.parse(string)),
        (source) =>
          map(source, (message: MessagePacket) => {
            if (message.from.id !== peerId)
              console.log("WARN", "Message does not match specified sender");
            else chatEvents.emit("message:receive", message);
          }),
        drain
      );
      console.log("INFO", `Stream from ${peerId} processed successfully.`);
    } catch (err: any) {
      console.log(
        "ERROR",
        `Error processing stream from ${peerId}: ${err.message}`
      );
    } finally {
      stream.close();
    }
  }

  private async sendInfoToStream(stream: Stream, id: string) {
    try {
      const profile = await this.getProfile();
      await pipe(
        [fromString(JSON.stringify(profile))],
        (source) => lp.encode(source),
        stream.sink
      );
      console.log("INFO", `Profile sent to ${id}: ${JSON.stringify(profile)}`);
    } catch (err: any) {
      console.log("ERROR", `Error sending profile to ${id}: ${err.message}`);
    } finally {
      stream.close();
    }
  }
}
