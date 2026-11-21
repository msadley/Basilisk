import * as Comlink from "comlink";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { SQLocalDrizzle } from "sqlocal/drizzle";
import {
  services,
  databaseSchema,
  DATABASE_INIT_STATEMENTS,
  initializeDatabase,
  type WorkerEventSink,
} from "@basilisk/core";

// Even though the db is initialized here on the worker thread, sqlocal
// actually spawns a separate thread for only the sqlite worker itself.
// That means sqlite i/o accesses produces one rpc hop in this architecture.
const { driver, batchDriver } = new SQLocalDrizzle({
  databasePath: "basilisk.sqlite3",
  onInit: (sql) =>
    DATABASE_INIT_STATEMENTS.map((statement) => sql(statement)),
});
const db = drizzle(driver, batchDriver, {
  schema: databaseSchema,
});

Comlink.expose({
  init: async (relayAddress: string, sink: WorkerEventSink) => {
    await initializeDatabase(db);
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
