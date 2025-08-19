// apps/cli/src/index.ts

import "dotenv/config";
import readline from "readline";
import { log } from "@basilisk/utils";
import { Node, stdinToStream, streamToConsole } from "@basilisk/core";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { peerIdFromString } from "@libp2p/peer-id";

const entries = [
  "ping address",
  "print addresses",
  "chat address",
  "dial address",
  "exit",
];
const node: Node = await Node.init();

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
      await chat();
      break;

    case "4":
      await dial();
      break;

    case "5":
      console.log("Exiting...");
      node.stop();
      rl.close();
      process.exit(0);

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

async function chat() {
  const maString: string = await prompt(
    "Enter the multiaddress to start the chat: "
  );

  if (!maString) {
    console.log("No multiaddress provided.");
    await prompt("Press Enter to continue...");
    return;
  }

  try {
    const multiAddress: Multiaddr = multiaddr(maString);
    try {
      const chatStream = await node.startChatStream(multiAddress);
      console.log("Chat stream started with " + maString);
      stdinToStream(chatStream);
      streamToConsole(chatStream);
    } catch (error: any) {
      log("ERROR", `Error when chatting ${maString}: ` + error.message);
      console.log(`Error when chatting ${maString}: ` + error.message);
    }
  } catch (error: any) {
    log("ERROR", "Error parsing multiaddress: " + error.message);
  } finally {
    await prompt("Press Enter to continue...");
  }
}

async function dial() {
  const maString: string = await prompt("Enter the multiaddress to dial: ");

  if (!maString) {
    console.log("No multiaddress provided.");
    await prompt("Press Enter to continue...");
    return;
  }

  try {
    const multiAddress: Multiaddr = multiaddr(maString);
    try {
      console.log("Starting dial to" + maString);
      await node.dial(multiAddress);
      console.log("Succesfully dialed " + maString);

      const checkInterval = setInterval(() => {
        const connections = node.getConnections(peerIdFromString(maString));

        const directConnection = connections.find(
          (conn) => !conn.remoteAddr.toString().includes("/p2p-circuit")
        );

        if (directConnection) {
          console.log("Found direct (hole-punched) connection:");
          console.log(
            "Remote Address:",
            directConnection.remoteAddr.toString()
          );
          clearInterval(checkInterval);
        } else {
          console.log(
            "Still on a relayed connection or connecting, checking again in 5 seconds..."
          );
        }
      }, 5000);
    } catch (error: any) {
      await log("ERROR", "Error dialing node: " + error.message);
    }
  } catch (error: any) {
    log("ERROR", "Error parsing multiaddress: " + error.message);
  } finally {
    await prompt("Press Enter to continue...");
  }
}
