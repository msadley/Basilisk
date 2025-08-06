// src/app/app.ts

import { Node } from "../networking/node.js";

export const CONFIG_FILE = "config/config.json";

export class App {
  private node: Node;

  private constructor(nodeInstance: Node) {
    this.node = nodeInstance;
  }

  static async init(): Promise<App> {
    const node = await Node.create();
    await node.start();
    return new App(node);
  }

  printAddresses(): string[] {
    return this.node.printAddresses();
  }

  pingTest(multiaddr: string) {
    this.node.pingTest(multiaddr);
  }

  async stop() {
    return this.node
      .stop()
      .then(() => {
        console.log("Node stopped successfully.");
        process.exit(0);
      })
      .catch((error) => {
        console.error("An error occurred while stopping the node:", error);
        process.exit(1);
      });
  }
}
