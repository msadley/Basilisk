// packages/core/src/basilisk.ts

import {
  getDatabase,
  getDatabases,
  getMessage,
  getMessages,
  saveMessage,
} from "./data/database.js";
import {
  getName,
  getProfilePicture,
  setName,
  setProfilePicture,
} from "./profile/profile.js";
import { Node, chatEvents } from "./node.js";
import { log, setHomePath } from "@basilisk/utils";
import { type Multiaddr } from "@multiformats/multiaddr";
import type { Database, Message } from "./types.js";
import { type Profile } from "./types.js";

const DEFAULT_HOME: string = "basilisk_data/";

export class Basilisk {
  private node: Node;

  private constructor(nodeInstance: Node) {
    this.node = nodeInstance;

    chatEvents.on(
      "message:receive",
      async (message: Message, remoteAddr: string) => {
        await log("INFO", `Message received from ${remoteAddr}`);
        await saveMessage(message, remoteAddr);
      }
    );
  }

  static async init(nodeType: "CLIENT" | "RELAY", home?: string) {
    setHomePath(home ? home : DEFAULT_HOME);

    const nodeInstance = await Node.init(nodeType);
    return new Basilisk(nodeInstance);
  }

  async getProfile(): Promise<Profile> {
    return {
      id: this.getId(),
      addresses: this.getMultiaddrs().map((addr) => addr.toString()),
      name: await this.getName(),
      profilePicture: await this.getProfilePicture(),
    };
  }

  getId(): string {
    return this.node.getId();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  async getName(): Promise<string> {
    return await getName();
  }

  async setName(name: string) {
    await setName(name);
  }

  async getProfilePicture(): Promise<string> {
    return await getProfilePicture();
  }

  async setProfilePicture(picture: string) {
    await setProfilePicture(picture);
  }

  async getChats(): Promise<string[]> {
    return await getDatabases();
  }

  async getChatById(id: string): Promise<Database> {
    return await getDatabase(id);
  }

  async getMessages(id: string): Promise<Message[]> {
    return await getMessages(id);
  }

  async getMessage(id: string, msg: number): Promise<Message> {
    return await getMessage(id, msg);
  }

  stop() {
    this.node.stop();
  }

  ping(addr: string): Promise<number> {
    return this.node.pingTest(addr);
  }

  getChatMessages(id: string) {
    getMessages(id);
  }

  async sendMessage(id: string, content: string) {
    const message: Message = {
      content: content,
      timestamp: Date.now(),
      from: this.node.getId(),
      to: id,
    };
    await this.node.sendMessage(message);
    await saveMessage(message, id);
  }

  async sendMedia(_addr: string, _path: string) {
    // TODO
  }
}
