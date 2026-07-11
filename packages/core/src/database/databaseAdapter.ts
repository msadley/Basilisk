import { drizzle, type AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "./databaseSchema.js";

export type AppDatabase = ReturnType<typeof setupDatabaseAdapter>;

export function setupDatabaseAdapter(driver: AsyncRemoteCallback) {
  return drizzle<typeof schema>(driver, { schema });
}
