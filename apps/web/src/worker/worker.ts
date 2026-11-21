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

const workerApi = {
  init: async (relayAddress: string, sink: WorkerEventSink) => {
    await initializeDatabase(db);
    const coreServices = await services(db, relayAddress, sink);
    return Comlink.proxy({
      messageService: Comlink.proxy(coreServices.messageService),
      chatService: Comlink.proxy(coreServices.chatService),
      profileService: Comlink.proxy(coreServices.profileService),
      nodeService: Comlink.proxy(coreServices.nodeService),
      identityService: Comlink.proxy(coreServices.identityService),
    });
  },
};

Comlink.expose(workerApi);

export type BasiliskInitializer = typeof workerApi;

export type Services = Awaited<ReturnType<BasiliskInitializer["init"]>>;
