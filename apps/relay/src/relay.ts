// apps/relay/src/relay.ts

import "dotenv/config";
import { type Multiaddr } from "@multiformats/multiaddr";
import { Node } from "@basilisk/core";

let basilisk: Node;

const PUBLIC_DNS: string | undefined = process.env.PUBLIC_DNS;

if (!PUBLIC_DNS) throw new Error("No public dns was specified.");

export async function start() {
  basilisk = await Node.init({
    mode: "RELAY",
    publicDns: process.env.PUBLIC_DNS!,
  });

  printAddresses();

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
  if (basilisk) {
    await basilisk.stop();
  }
}

function printAddresses() {
  console.log("Listening on: ");
  const addresses = basilisk.getMultiaddrs();
  addresses.forEach((addr: Multiaddr) => console.log(addr.toString()));
}
