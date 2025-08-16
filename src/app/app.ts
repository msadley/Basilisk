// src/app/app.ts

import { Node } from "../network/node.js";
import { validateConfigFile } from "../config/config.js";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { log } from "../util/log.js";

export class App {
  private node: Node;

  private constructor(nodeInstance: Node) {
    this.node = nodeInstance;
  }

  static async init(): Promise<App> {
    await log("INFO", "Initializing node...");
    await validateConfigFile();
    const node = await Node.create();
    await log("INFO", "Node initialized.");
    return new App(node);
  }

  printAddresses(): string[] {
    return this.node.printAddresses();
  }

  pingTest(ma: string) {
    try {
      const multiAddress: Multiaddr = multiaddr(ma);
      try {
        return this.node.pingTest(multiAddress);
      } catch (error: any) {
        log("ERROR", "Error pinging node: " + error.message);
        console.log("Error pinging node: ", error.message);
      }
    } catch (error: any) {
      log("ERROR", "Error parsing multiaddress: " + error.message);
      console.log("Error parsing multiaddress: ", error.message);
    }
  }

  async stop() {
    return await this.node.stop();
  }
}
