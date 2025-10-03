// packages/core/src/basilisk.ts

import { Node } from "./node.js";
import type { Message } from "./message.js";
import { setHomePath } from "@basilisk/utils";

const DEFAULT_HOME: string = "basilisk_data/";

export class Basilisk {
  private node: Node;

  private constructor(nodeInstance: Node) {
    this.node = nodeInstance;
  }

  static async init(nodeType: "CLIENT" | "RELAY", home?: string) {
    setHomePath(home ? home : DEFAULT_HOME);

    const nodeInstance = await Node.init(nodeType);
    return new Basilisk(nodeInstance);
  }

  getId(): string {
    return this.node.getId();
  }

  getMultiaddrs() {
    return this.node.getMultiaddrs();
  }

  async stop() {
    this.node.stop();
  }

  async ping(addr: string) {
    this.node.pingTest(addr);
  }

  async retrieveChat(_addr: string) {
    // TODO
  }

  async sendMessage(addr: string, content: string) {
    const message: Message = {
      content: content,
      timestamp: Date.now(),
      from: this.node.getId(),
      to: addr,
    };
    await this.node.sendMessage(message);
  }

  async sendMedia(_addr: string, _path: string) {
    // TODO
  }
}
