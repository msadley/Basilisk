import * as Comlink from "comlink";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { SQLocalDrizzle } from "sqlocal/drizzle";
import { services, databaseSchema, uiCallbackFn } from "@basilisk/core";

const { driver, batchDriver } = new SQLocalDrizzle("basilisk.sqlite3");
const db = drizzle(driver, batchDriver, {
  schema: databaseSchema,
});

// It could be possible to reduce the boilerplate here even further by initializing
// the database on the main thread and passing the 'services' object directly to the
// workerController to initialize.
Comlink.expose({
  init: async (relayAddress: string, callback: uiCallbackFn) => {
    return await services(db, relayAddress, callback);
  },
});

export type BasiliskInitializer = {
  init: (
    relayAddress: string,
    callback: uiCallbackFn,
  ) => ReturnType<typeof services>;
};

export type Services = Awaited<ReturnType<typeof services>>;
