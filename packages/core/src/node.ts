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
import { getPeerId, log, multiaddrFromPeerId } from "@basilisk/utils";
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
    await log("INFO", "Initializing node...");

    if (mode === "CLIENT") {
      await log("INFO", `Using bootstrap nodes: ${bootstrapNodes.join(", ")}`);

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
      await log("INFO", "Creating chat protocol...");
      await node.handle("/chat/1.0.0", async ({ stream, connection }) => {
        await log(
          "INFO",
          `Chat stream opened with ${connection.remoteAddr.toString()}`
        );
        await basiliskNode.retrieveMessageFromStream(
          stream,
          getPeerId(connection.remoteAddr)
        );
      });
      await log("INFO", "Chat protocol created.");

      await log("INFO", "Creating info protocol...");
      await node.handle("/info/1.0.0", async ({ stream, connection }) => {
        await log(
          "INFO",
          `Info stream opened with ${connection.remoteAddr.toString()}`
        );
        await basiliskNode.sendInfoToStream(
          stream,
          getPeerId(connection.remoteAddr)
        );
      });
      await log("INFO", "Info protocol created.");
    }

    await node.start();
    await setId(node.peerId.toString());

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

  async getProfile(): Promise<Profile> {
    return await getProfile();
  }

  async pingTest(addr: string): Promise<number> {
    const pingService = this.node.services.ping as {
      ping: (addr: Multiaddr) => Promise<number>;
    };
    const latency: number = await pingService.ping(multiaddr(addr));
    await log("INFO", `Pinged ${addr.toString()} in ${latency}ms`);
    return latency;
  }

  async createChatConnection(peerId: string) {
    await log("INFO", `Creating chat connection with ${peerId}...`);
    try {
      const stream: Stream = await this.node.dialProtocol(
        multiaddrFromPeerId(bootstrapNodes[0], peerId),
        "/chat/1.0.0"
      );
      const connection = new Connection(stream);
      this.chatConnections.set(peerId, connection);
      await log("INFO", `Chat connection created with ${peerId}.`);
    } catch (error: any) {
      await log("ERROR", "Failed to create chat connection: " + error.message);
    }
  }

  async getPeerProfile(peerId: string): Promise<Profile> {
    await log("INFO", `Requesting profile from ${peerId}...`);
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
    await log("INFO", `Profile received from ${peerId}`);
    return response;
  }

  async closeChatStream(id: string) {
    await log("INFO", `Closing chat connection with ${id}...`);
    this.chatConnections.delete(id);
    await log("INFO", `Closed chat connection with ${id}.`);
  }

  async sendMessage(message: MessagePacket) {
    await log("INFO", `Sending message to ${message.to}`);
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
    await log("INFO", `Message sent to ${message.to}.`);
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
              log("WARN", "Message does not match specified sender");
            else chatEvents.emit("message:receive", message);
          }),
        drain
      );
      await log("INFO", `Stream from ${peerId} processed successfully.`);
    } catch (err: any) {
      await log(
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
      await log("INFO", `Profile sent to ${id}: ${JSON.stringify(profile)}`);
    } catch (err: any) {
      await log("ERROR", `Error sending profile to ${id}: ${err.message}`);
    } finally {
      stream.close();
    }
  }
}
