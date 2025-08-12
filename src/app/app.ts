// src/app/app.ts

import { Node } from "../network/node.js";
import { validateConfigFile } from "../config/config.js";

export class App {
  
  dial(ma: string) {
    this.node.dial(ma);
  }
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
