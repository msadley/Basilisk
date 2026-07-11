import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/databaseSchema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "basilisk.db",
  },
});
