// apps/cli/index.ts

import "dotenv/config";
import readline from "readline";
import { log } from "@basilisk/utils";
import { Node } from "@basilisk/core";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

const entries = ["ping address", "print addresses", "exit"];
const node : Node = await Node.init();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function prompt(query: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  while (true) {
    // Setting up the prompt
    console.clear();

    console.log(`------------------------------------------------------------------------------
----------------------------Welcome to Basilisk CLI----------------------------
------------------------------------------------------------------------------`);

    for (let i = 0; i < entries.length; i++)
      console.log(`${i + 1}. ` + entries[i]);

    const answer: string = await prompt("\nPlease select an option: ");

    switch (answer) {
      case "1":
        await pingTest();
        break;

      case "2":
        node.printAddresses().forEach((addr: string) => {
          console.log(addr);
        });
        await prompt("Press Enter to continue...");
        break;

      case "3":
        console.log("Exiting...");
        node.stop();
        rl.close();
        return;

      default:
        await prompt("Invalid option!\nPress Enter to continue...");
        break;
    }
  }

  async function pingTest() {
    const maString: string = await prompt("Enter the multiaddress to ping: ");

    if (!maString) {
      console.log("No multiaddress provided.");
      await prompt("Press Enter to continue...");
      return;
    }

    try {
      const multiAddress: Multiaddr = multiaddr(maString);
      try {
        const result = await node.pingTest(multiAddress);
        if (result) {
          console.log(result);
          await log("INFO", result);
        }
      } catch (error: any) {
        log("ERROR", "Error pinging node: " + error.message);
      }
    } catch (error: any) {
      log("ERROR", "Error parsing multiaddress: " + error.message);
    } finally {
      await prompt("Press Enter to continue...");
    }
  }