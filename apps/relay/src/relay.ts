// apps/relay/src/relay.ts

import "dotenv/config";

import { type Multiaddr } from "@multiformats/multiaddr";
import { Node } from "@basilisk/core";

const PUBLIC_DNS: string | undefined = process.env.PUBLIC_DNS;

if (!PUBLIC_DNS) throw new Error("No public dns was specified.");

const basilisk = await Node.init({
  mode: "RELAY",
  publicDns: process.env.PUBLIC_DNS!,
});

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
