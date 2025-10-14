// packages/core/src/basilisk.ts

import { Node, chatEvents } from "./node.js";
import { retrieveMessages, saveMessage, type Message } from "./database.js";
import { log, setHomePath } from "@basilisk/utils";
import type { Multiaddr } from "@multiformats/multiaddr";

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

  getId(): string {
    return this.node.getId();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  stop() {
    this.node.stop();
  }

  ping(addr: string): Promise<number> {
    return this.node.pingTest(addr);
  }

  retrieveChatMessages(addr: string) {
    retrieveMessages(addr);
  }

  openChatConnection(addr: string) {
    this.node.createChatConnection(addr);
  }

  closeChatConnection(addr: string) {
    this.node.closeChatStream(addr);
  }

  async sendMessage(addr: string, content: string) {
    const message: Message = {
      content: content,
      timestamp: Date.now(),
      from: this.node.getId(),
      to: addr,
    };
    await this.node.sendMessage(message);
    await saveMessage(message, addr);
  }

  async sendMedia(_addr: string, _path: string) {
    // TODO
  }
}
