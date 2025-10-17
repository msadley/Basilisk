// apps/relay/src/relay.ts

import "dotenv/config";

import { type Multiaddr } from "@multiformats/multiaddr";
import { Basilisk } from "@basilisk/core";

const basilisk = await Basilisk.init("RELAY");

export function start() {
  printAddresses();

  process.on("SIGINT", async () => {
    stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    stop();
    process.exit(0);
  });
}

function stop() {
  basilisk.stop();
}

function printAddresses() {
  console.log("Listening on: ");
  const addresses = basilisk.getMultiaddrs();
  addresses.forEach((addr: Multiaddr) => console.log(addr.toString()));
}
