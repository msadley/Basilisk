import { createLibp2p, type Libp2p } from "libp2p";
import type { Stream } from "@libp2p/interface";
import { EventEmitter } from "events";
import map from "it-map";
import { pipe } from "it-pipe";
import drain from "it-drain";
import * as lp from "it-length-prefixed";
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";
import { getPeerId, multiaddrFromPeerId } from "./peerId.js";
import { getLibp2pOptions } from "./libp2p.js";
import { Connection } from "./connection.js";
import type { MessagePacket, NodeConfig, Profile } from "./types.js";
import { getMyProfile } from "./database.js";
import { getAppKey } from "./keys.js";

export const chatEvents = new EventEmitter();

let RELAY_ADDR: string;

export class Node {
  private node: Libp2p;
  private chatConns: Map<string, Connection> = new Map();

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;

    this.node.addEventListener("connection:close", (evt) => {
      const remoteAddr = evt.detail.remoteAddr;
      this.chatConns.delete(remoteAddr.toString());
    });
  }

  static async init(options: NodeConfig): Promise<Node> {
    if (options.mode === "RELAY") {
      console.info("Initializing relay node...");

      const privateKey = await getAppKey();
      const libp2pNode = await createLibp2p(
        await getLibp2pOptions(options, privateKey)
      );
      const node = new Node(libp2pNode);

      await libp2pNode.start();

      console.info("Relay node initialized.");

      return node;
    }

    console.info("Initializing libp2p node");

    RELAY_ADDR = options.relayAddr ?? "";

    const privateKey = await getAppKey();
    const libp2pNode = await createLibp2p(
      await getLibp2pOptions(options, privateKey)
    );
    const node = new Node(libp2pNode);

    await libp2pNode.handle("/chat/1.0.0", async ({ stream, connection }) => {
      await node.retrieveMessageFromStream(
        stream,
        getPeerId(connection.remoteAddr)
      );
    });

    await libp2pNode.handle("/info/1.0.0", async ({ stream, connection }) => {
      await node.sendInfoToStream(stream, getPeerId(connection.remoteAddr));
    });

    return node;
  }

  async start() {
    console.debug("Starting node...");
    await this.node.start();
  }

  getPeerId(): string {
    return this.node.peerId.toString();
  }

  subscribe(chatId: string): void {
    (this.node.services as any).pubsub.subscribe(chatId)
  }

  private async createChatConn(peerId: string) {
    if (this.chatConns.has(peerId)) return;

    try {
      const addr = multiaddrFromPeerId(RELAY_ADDR, peerId);

      const stream = await this.node.dialProtocol(addr, "/chat/1.0.0");
      this.chatConns.set(peerId, new Connection(stream));
    } catch (error: any) {
      console.warn("Failed to create chat connection: " + error.message);
    }
  }

  async getPeerProfile(peerId: string): Promise<Profile> {
    const addr = multiaddrFromPeerId(RELAY_ADDR, peerId);
    const stream = await this.node.dialProtocol(addr, "/info/1.0.0");
    const response = await pipe(
      stream.source,
      (source) => lp.decode(source),
      (source) => map(source, (buf) => toString(buf.subarray())),
      async function (source) {
        for await (const msg of source) {
          return JSON.parse(msg) as Profile;
        }
        throw new Error("Stream ended without a response");
      }
    );

    return response;
  }

  async sendMessage(message: MessagePacket) {
    await this.createChatConn(message.chatId);
    const conn = this.chatConns.get(message.chatId);
    if (!conn)
      throw new Error(`Failed to create chat connection for ${message.chatId}`);
    conn.sendMessage(message);
    console.info(`[INFO] Message sent to ${message.chatId}`);
  }

  private async retrieveMessageFromStream(stream: Stream, peerId: string) {
    try {
      await pipe(
        stream.source,
        (source) => lp.decode(source),
        (source) => map(source, (buffer) => toString(buffer.subarray())),
        (source) => map(source, (string) => JSON.parse(string)),
        (source) =>
          map(source, (message: MessagePacket) => {
            if (message.from !== peerId)
              console.warn("[WARN] Message does not match specified sender");
            else chatEvents.emit("message:receive", message);
          }),
        drain
      );
    } catch (err: any) {
      console.warn(
        `[WARN]Error processing stream from ${peerId}: ${err.message}`
      );
    } finally {
      stream.close();
    }
  }

  private async sendInfoToStream(stream: Stream, id: string) {
    try {
      const profile = await getMyProfile();
      await pipe(
        [fromString(JSON.stringify(profile))],
        (source) => lp.encode(source),
        stream.sink
      );
      console.info(`Profile sent to ${id}: ${JSON.stringify(profile)}`);
    } catch (err: any) {
      console.warn(`Error sending profile to ${id}: ${err.message}`);
    } finally {
      stream.close();
    }
  }
}
