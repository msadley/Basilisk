import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl =
  (process.env.DATABASE_URL || "basilisk.db").replace(/^file:/, "") ||
  "basilisk.db";

export default defineConfig({
  out: "./drizzle",
  schema: "../../packages/core/src/database/databaseSchema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});
