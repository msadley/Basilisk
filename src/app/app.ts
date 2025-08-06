// src/app/app.ts

import { Node } from "../networking/node.js";

export const CONFIG_FILE = "config/config.json";

class App {
  private node: Node;

  private constructor(nodeInstance: Node) {
    this.node = nodeInstance;
  }

  static async init() {
    const node = await Node.create();
    return new App(node);
  }

  
}