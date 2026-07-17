import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "../../packages/core/src/database/databaseSchema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "basilisk.db",
  },
});
