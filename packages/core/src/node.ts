import { createLibp2p, type Libp2p } from "libp2p";
import { type Multiaddr } from "@multiformats/multiaddr";
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
import type { MessagePacket, Profile } from "./types.js";
import { getMyProfile } from "./database.js";

export const chatEvents = new EventEmitter();

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

  static async init(
    options:
      | {
          mode: "CLIENT";
          bootstrapNodes: string[];
        }
      | { mode: "RELAY"; publicDns: string }
  ): Promise<Node> {
    if (options.mode === "RELAY") {
      console.log("INFO", "Initializing relay node...");

      const libp2pNode = await createLibp2p(await getLibp2pOptions(options));
      const node = new Node(libp2pNode);

      await libp2pNode.start();

      console.log("INFO", "Relay node initialized.");

      return node;
    }
    console.log("INFO", "Initializing node...");

    const libp2pNode = await createLibp2p(await getLibp2pOptions(options));
    const node = new Node(libp2pNode);

    console.log("INFO", "Creating chat protocol...");
    await libp2pNode.handle(
      "/chat/1.0.0",
      async ({ stream, connection: conn }) => {
        console.log(
          "INFO",
          `Chat stream opened with ${conn.remoteAddr.toString()}`
        );
        await node.retrieveMessageFromStream(
          stream,
          getPeerId(conn.remoteAddr)
        );
      }
    );

    console.log("INFO", "Creating info protocol...");
    await libp2pNode.handle(
      "/info/1.0.0",
      async ({ stream, connection: conn }) => {
        console.log(
          "INFO",
          `Info stream opened with ${conn.remoteAddr.toString()}`
        );
        await node.sendInfoToStream(stream, getPeerId(conn.remoteAddr));
      }
    );
    console.log("INFO", "Node initialized.");

    return node;
  }

  async start() {
    await this.node.start();
  }

  async stop() {
    console.log("INFO", "Stopping node...");
    await this.node.stop();
  }

  getPeerId(): string {
    return this.node.peerId.toString();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  async createChatConn(peerId: string) {
    if (this.chatConns.has(peerId)) return;

    try {
      const stream = await this.node.dialProtocol(
        multiaddrFromPeerId(this.node.getMultiaddrs()[0].toString(), peerId), // This is not ideal, we should get the relay address from a reliable source
        "/chat/1.0.0"
      );
      this.chatConns.set(peerId, new Connection(stream));
      console.log("INFO", `Chat connection created with ${peerId}.`);
    } catch (error: any) {
      console.log("Failed to create chat connection: " + error.message);
    }
  }

  async getPeerProfile(peerId: string): Promise<Profile> {
    const stream = await this.node.dialProtocol(
      multiaddrFromPeerId(this.node.getMultiaddrs()[0].toString(), peerId), // This is not ideal, we should get the relay address from a reliable source
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

  async closeChatConn(id: string) {
    this.chatConns.delete(id);
    console.log("INFO", `Closed chat connection with ${id}.`);
  }

  async sendMessage(message: MessagePacket) {
    await this.createChatConn(message.to);
    const conn = this.chatConns.get(message.to);
    if (!conn)
      throw new Error(`Failed to create chat connection for ${message.to}`);
    conn.sendMessage(message);
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
      console.log(`Error processing stream from ${peerId}: ${err.message}`);
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
      console.log("INFO", `Profile sent to ${id}: ${JSON.stringify(profile)}`);
    } catch (err: any) {
      console.log("ERROR", `Error sending profile to ${id}: ${err.message}`);
    } finally {
      stream.close();
    }
  }
}
