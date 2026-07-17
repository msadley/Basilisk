import "@abraham/reflection"
import { Basilisk, databaseSchema } from "@basilisk/core";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

async function callbackFn() {}

const relayAddress = "";

async function main() {
  const client = createClient({ 
    url: "file:basilisk.db" 
  });

  const orm = drizzle(client, { schema: databaseSchema });

  const basilisk = await Basilisk.init(orm, callbackFn, relayAddress);
  
  basilisk.handleEvent({
    id: "",
    type: "ping-relay",
  });
}

main();