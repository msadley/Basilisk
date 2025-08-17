// src/index.ts

import "dotenv/config";
import { Node } from "./relay-node.js";

async function stop() {
  await node.stop();
}

async function printAddresses() {
  console.log("Listening on: ");
  const addresses = await node.getMultiAddresses();
  addresses.forEach((addr) => console.log(addr.toString()));
}

const node: Node = await Node.init();
await printAddresses();

process.on("SIGINT", async () => {
  await stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stop();
  process.exit(0);
});
