// src/interface/tui.ts

import readline from "readline";
import { App } from "../app/app.js";

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
    console.log("\n");

    switch (answer) {
      case "1":
        const multiaddr = await prompt("Enter the multiaddress to ping: ");
        if (!multiaddr) {
          console.log("No multiaddress provided.");
          await prompt("\nPress Enter to continue...");
          continue;
        }
        app.pingTest(multiaddr);
        await prompt("\nPress Enter to continue...");
        break;

      case "2":
        app.printAddresses().forEach((addr: string) => {
          console.log(addr);
        });
        await prompt("\nPress Enter to continue...");
        break;

      case "3":
        console.log("Exiting...");
        app.stop();
        rl.close();
        return;
    }
  }
}
