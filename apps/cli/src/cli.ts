// apps/cli/src/cli.ts

import readline from "readline";
import { log } from "@basilisk/utils";
import { Basilisk } from "@basilisk/core";
import type { Multiaddr } from "@multiformats/multiaddr";

let configArg = process.argv
  .find((arg) => arg.startsWith("--home="))
  ?.split("=")[1];
if (!configArg) {
  configArg = "./basilisk_data";
}

const basilisk: Basilisk = await Basilisk.init("CLIENT", configArg);

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

export async function cli() {
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

  await menu();
}

async function menu() {
  while (true) {
    const answer: string = await prompt("Basilisk> ");

    if (answer[0] === "/") {
      const data: string[] = answer.split(" ");
      switch (data[0]) {
        case "/ping":
          await pingTest(data[1]);
          break;

        case "/addresses":
          basilisk.getMultiaddrs().forEach((addr: Multiaddr) => {
            console.log(addr.toString());
          });
          break;

        case "/exit":
          await stop();
          break;

        case "/message":
          if (!data[1] || !data[2]) {
            help();
          } else {
            await basilisk.sendMessage(data[1], data[2]);
          }
          break;

        default:
          help();
          break;
      }
    } else {
      help();
    }
  }
}

async function pingTest(addr: string | undefined) {
  if (addr === undefined) {
    console.log("Usage: /ping <address>");
    return;
  }
  try {
    const result = await basilisk.ping(addr);
    console.log("Latency: " + result + "ms");
  } catch (error: any) {
    log("ERROR", "Error pinging node: " + error.message);
  }
}

async function help() {
  console.log(`Commands available:
/addresses                      List the addresses this node is listening on
/ping <address>                 Ping a node listening on <address>
/message <address> <content>    Send a message to <address> containing <content>
/exit                           Exit the application
/help                           Show this menu
          `);
}

async function stop() {
  console.log("\nExiting...");
  basilisk.stop();
  rl.close();
  process.exit(0);
}
