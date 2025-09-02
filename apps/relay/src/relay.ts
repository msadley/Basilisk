// apps/relay/src/relay.ts

import { Node } from "@basilisk/core";

const node: Node = await Node.init("RELAY");

export async function start() {
  await printAddresses();

  process.on("SIGINT", async () => {
    await stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await stop();
    process.exit(0);
  });
}

async function stop() {
  await node.stop();
}

async function printAddresses() {
  console.log("Listening on: ");
  const addresses = node.getMultiaddrs();
  addresses.forEach((addr) => console.log(addr.toString()));
}
