// apps/relay/src/relay.ts

import "dotenv/config";
import { type Multiaddr } from "@multiformats/multiaddr";
import { Node } from "@basilisk/core";
import io from "@pm2/io";

import { type CircuitRelayService } from "@libp2p/circuit-relay-v2";

let basilisk: Node;

let reservationPoller: NodeJS.Timeout;

const PUBLIC_DNS: string | undefined = process.env.PUBLIC_DNS;

if (!PUBLIC_DNS) throw new Error("No public dns was specified.");

const relayReservations = io.metric({
  name: "Relay Reservations",
});

export async function start() {
  basilisk = await Node.init({
    mode: "RELAY",
    publicDns: process.env.PUBLIC_DNS!,
  });

  printAddresses();

  reservationPoller = setInterval(() => {
    if (!basilisk || !basilisk.node) {
      return;
    }

    const relayService = basilisk.node.services
      .circuitRelay as CircuitRelayService;

    if (relayService) {
      const reservationCount = relayService.reservations.size;
      relayReservations.set(reservationCount);
    } else {
      relayReservations.set(0);
    }
  }, 2000);

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
  if (reservationPoller) {
    clearInterval(reservationPoller);
  }
  if (basilisk) {
    await basilisk.stop();
  }
}

function printAddresses() {
  console.log("Listening on: ");
  const addresses = basilisk.getMultiaddrs();
  addresses.forEach((addr: Multiaddr) => console.log(addr.toString()));
}
