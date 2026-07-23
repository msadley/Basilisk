import { Basilisk, databaseSchema, type uiCallbackFn } from "@basilisk/core";
import * as Comlink from "comlink";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { SQLocalDrizzle } from "sqlocal/drizzle";

Comlink.expose({
  init: async (params: { callbackFn: uiCallbackFn; relayAddress: string }) => {
    const { driver, batchDriver } = new SQLocalDrizzle("basilisk.sqlite3");
    const db = drizzle(driver, batchDriver, {
      schema: databaseSchema,
    });

    const basilisk = await Basilisk.init(
      db,
      params.callbackFn,
      params.relayAddress,
    );
    return Comlink.proxy(basilisk);
  },
});
