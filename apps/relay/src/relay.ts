// apps/relay/src/relay.ts

import { type Multiaddr } from "@multiformats/multiaddr";
import { Basilisk } from "@basilisk/core";

const basilisk = await Basilisk.init("RELAY");

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
  await basilisk.stop();
}

async function printAddresses() {
  console.log("Listening on: ");
  const addresses = basilisk.getMultiaddrs();
  addresses.forEach((addr: Multiaddr) => console.log(addr.toString()));
}
