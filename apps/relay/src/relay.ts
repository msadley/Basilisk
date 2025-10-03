// apps/relay/src/relay.ts

import { DEFAULT_HOME } from "@basilisk/core";
import { type Multiaddr } from "@multiformats/multiaddr";

const basilisk = await DEFAULT_HOME.init("RELAY");

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
