import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

export type DatabaseAdapter = ReturnType<typeof createDatabaseAdapter>;

function createDatabaseAdapter() {
  const database = createClient({
    url: process.env.DATABASE_URL ?? "file:basilisk.db",
  });
  return drizzle(database);
}

export const databaseAdapter = createDatabaseAdapter();
