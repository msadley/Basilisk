// src/interface/tui.ts

import readline from "readline";
import { App } from "../app/app.js";
import { log } from "../util/log.js";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

const entries = ["ping address", "print addresses", "exit"];

export async function menu(app: App) {
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
--------------------------Welcome to the CCChat CLI!--------------------------
------------------------------------------------------------------------------`);

    for (let i = 0; i < entries.length; i++)
      console.log(`${i + 1}. ` + entries[i]);

    const answer: string = await prompt("\nPlease select an option: ");

    switch (answer) {
      case "1":
        await pingTest();
        break;

      case "2":
        app.printAddresses().forEach((addr: string) => {
          console.log(addr);
        });
        await prompt("Press Enter to continue...");
        break;

      case "3":
        console.log("Exiting...");
        app.stop();
        rl.close();
        return;

      default:
        await prompt("Invalid option!\nPress Enter to continue...");
        break;
    }
  }

  async function pingTest() {
    const multiAddress : string = await prompt("Enter the multiaddress to ping: ");

    if (!multiAddress) {
      console.log("No multiaddress provided.");
      await prompt("Press Enter to continue...");
      return;
    }

    try {
      const pingPromise = app.pingTest(multiAddress);
      if (pingPromise) {
        const result = await pingPromise;
        console.log(result);
        await log("INFO", result);
      }
    } catch (error: any) {
      const errorMessage = "Ping failed: " + error.message;
      await log("ERROR", errorMessage);
      console.log(errorMessage);
    } finally {
      await prompt("Press Enter to continue...");
    }
  }
}
