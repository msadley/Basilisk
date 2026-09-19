import * as Comlink from "comlink";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { SQLocalDrizzle } from "sqlocal/drizzle";
import { services, databaseSchema } from "@basilisk/core";
import { WorkerEventSink } from "@basilisk/core/src/types";

// Even though the db is initialized here on the worker thread, sqlocal
// actually spawns a separate thread for only the sqlite worker itself.
// That means sqlite i/o accesses produce one rpc hop in this architecture.
const { driver, batchDriver } = new SQLocalDrizzle("basilisk.sqlite3");
const db = drizzle(driver, batchDriver, {
  schema: databaseSchema,
});

Comlink.expose({
  init: async (relayAddress: string, sink: WorkerEventSink) => {
    return await services(db, relayAddress, sink);
  },
});

export type BasiliskInitializer = {
  init: (
    relayAddress: string,
    sink: WorkerEventSink,
  ) => ReturnType<typeof services>;
};

export type Services = Awaited<ReturnType<typeof services>>;
