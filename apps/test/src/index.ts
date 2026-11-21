import "dotenv/config";
import { databaseSchema, type PushEvent, services } from "@basilisk/core";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import mitt from "mitt";

type PushEventMap = {
  [T in PushEvent["type"]]: Extract<PushEvent, { type: T }>;
};

async function main() {
  const relayAddress =
    process.env.RELAY_ADDRESS?.trim() ||
    process.env.VITE_RELAY_MULTIADDRESS?.trim();

  if (!relayAddress) {
    throw new Error(
      "RELAY_ADDRESS or VITE_RELAY_MULTIADDRESS environment variable must be set",
    );
  }

  const client = createClient({
    url: process.env.DATABASE_URL || "file:basilisk.db",
  });

  const orm = drizzle(client, { schema: databaseSchema });
  const emitter = mitt<PushEventMap>();
  const eventSink = {
    emit: (event: PushEvent) => {
      emitter.emit(event.type, event);
    },
  };

  const basilisk = await services(orm, relayAddress, eventSink);
  await basilisk.nodeService.start();
  const pingTime = await basilisk.nodeService.pingRelay();
  console.log(`Ping time: ${pingTime}ms`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
