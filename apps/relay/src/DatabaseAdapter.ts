import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export type DatabaseAdapter = ReturnType<typeof createDatabaseAdapter>;

function createDatabaseAdapter() {
  const database = new Database("basilisk.db");
  return drizzle(database);
}

export const databaseAdapter = createDatabaseAdapter();