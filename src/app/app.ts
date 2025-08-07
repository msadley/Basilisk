// src/app/app.ts

import { Node } from "../networking/node.js";
import { validateConfigFile } from "../util/json.js";

export const CONFIG_FILE = "config/config.json";

export class App {
  private node: Node;

  private constructor(nodeInstance: Node) {
    this.node = nodeInstance;
  }

  static async init(): Promise<App> {
    await validateConfigFile();
    const node = await Node.create();
    node.start();
    return new App(node);
  }

  printAddresses(): string[] {
    return this.node.printAddresses();
  }

  pingTest(multiaddr: string) {
    this.node.pingTest(multiaddr);
  }

  stop() {
    return this.node.stop()
  }
}
