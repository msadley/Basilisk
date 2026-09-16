import "@abraham/reflection";
import { services, databaseSchema } from "@basilisk/core";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

async function callbackFn() {}

const relayAddress = "";

async function main() {
  const client = createClient({
    url: "file:basilisk.db",
  });

  const orm = drizzle(client, { schema: databaseSchema });

  const basilisk = await services(orm, relayAddress, callbackFn);

  const pingTime = await basilisk.nodeService.pingRelay();
  console.log(`Ping time: ${pingTime}ms`);
}

main();
