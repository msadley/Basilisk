// packages/core/src/basilisk.ts

import {
  ensureDatabase,
  getChats,
  getMessage,
  getMessages,
  saveMessage,
} from "./data/database.js";
import { getProfile, setProfile } from "./profile/profile.js";
import { Node, chatEvents } from "./node.js";
import { log, setHomePath } from "@basilisk/utils";
import { type Multiaddr } from "@multiformats/multiaddr";
import {
  type Chat,
  type Message,
  type MessagePacket,
  type Profile,
} from "./types.js";

const DEFAULT_HOME: string = "basilisk_data/";

export class Basilisk {
  private node: Node;

  private constructor(nodeInstance: Node) {
    this.node = nodeInstance;

    chatEvents.on("message:receive", async (message: MessagePacket) => {
      await log("INFO", `Message received from ${message.from.id}`);
      await saveMessage(message);
    });
  }

  static async init(nodeType: "CLIENT" | "RELAY", home?: string) {
    setHomePath(home ? home : DEFAULT_HOME);
    await ensureDatabase();

    const nodeInstance = await Node.init(nodeType);
    return new Basilisk(nodeInstance);
  }

  async getProfile(): Promise<Profile> {
    return await getProfile();
  }

  async setProfile(name?: string, avatar?: string) {
    return await setProfile(name, avatar);
  }

  getId(): string {
    return this.node.getId();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  async getPeerProfile(id: string): Promise<Profile> {
    if (id === this.getId()) {
      return await this.getProfile();
    }
    return await this.node.getPeerProfile(id);
  }

  async getChats(): Promise<Chat[]> {
    return await getChats();
  }

  async getMessages(
    id: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Message[]> {
    const offset = (page - 1) * limit;
    return await getMessages(id, limit, offset);
  }

  async getMessage(id: string, msg: number): Promise<Message> {
    return await getMessage(id, msg);
  }

  async stop() {
    await this.node.stop();
  }

  async ping(addr: string): Promise<number> {
    return await this.node.pingTest(addr);
  }

  async sendMessage(id: string, content: string) {
    const message: MessagePacket = {
      content: content,
      timestamp: Date.now(),
      from: await this.node.getProfile(),
      to: id,
    };
    await this.node.sendMessage(message);
    await saveMessage(message);
  }

  async sendMedia(_addr: string, _path: string) {
    // TODO
  }
}
