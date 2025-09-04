// apps/cli/src/cli.ts

import readline from "readline";
import { log } from "@basilisk/utils";
import { Node } from "@basilisk/core";

const node: Node = await Node.init("CLIENT");

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

export async function menu() {
  console.clear();
  console.log(
    "Welcome to Basilisk! Enter /help for the list of commands available"
  );

  process.on("SIGINT", async () => {
    await stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await stop();
    process.exit(0);
  });

  while (true) {
    const answer: string = await prompt("Basilisk> ");

    if (answer[0] === "/") {
      const data: string[] = answer.split(" ");
      switch (data[0]) {
        case "/ping":
          pingTest(data[1]);
          break;

        case "/addresses":
          node.printAddresses().forEach((addr: string) => {
            console.log(addr);
          });
          break;

        case "/chat":
          await chat(data[1]);
          break;

        case "/exit":
          await stop();
          break;

        default:
          help();
          break;
      }
    }
  }
}

async function pingTest(addr: string | undefined) {
  if (addr === undefined) {
    console.log("Usage: /ping <address>");
    return;
  }
  try {
    const result = await node.pingTest(addr);
    console.log(result);
    await log("INFO", result);
  } catch (error: any) {
    log("ERROR", "Error pinging node: " + error.message);
  }
}

async function chat(addr: string | undefined) {
  if (addr === undefined) {
    console.log("Usage: /chat <address>");
    return;
  }
  try {
    node.chat(addr);
  } catch (error: any) {
    log("ERROR", `Error when chatting ${addr}: ` + error.message);
    console.log(`Error when chatting ${addr}: ` + error.message);
  }
}

async function help() {
  console.log(`Commands available:
/addresses                      List the addresses this node is listening on
/ping <address>                 Ping a node listening on <address>
/chat <address>                 Start a chat session with <address>
/exit                           Exit the application
/help                           Show this menu
          `);
}

async function stop() {
  console.log("\nExiting...");
  node.stop();
  rl.close();
  process.exit(0);
}
