import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const DEFAULT_DATABASE_URL = "file:basilisk.db";

export function normalizeDatabaseUrl(rawUrl?: string): string {
  const url = rawUrl?.trim();
  if (!url) {
    return DEFAULT_DATABASE_URL;
  }
  if (
    url === ":memory:" ||
    url.startsWith("file:") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)
  ) {
    return url;
  }
  return `file:${url}`;
}

export type DatabaseAdapter = ReturnType<typeof createDatabaseAdapter>;

function createDatabaseAdapter() {
  const database = createClient({
    url: normalizeDatabaseUrl(process.env.DATABASE_URL),
  });
  return drizzle(database);
}

export const databaseAdapter = createDatabaseAdapter();
