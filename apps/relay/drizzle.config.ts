import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const DEFAULT_DATABASE_URL = "file:basilisk.db";

function normalizeDatabaseUrl(rawUrl?: string): string {
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

export default defineConfig({
  out: "./drizzle",
  schema: "./src/DatabaseSchema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.DATABASE_URL),
  },
});
