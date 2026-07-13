import { blob, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const identity = sqliteTable("identity", {
  id: integer().primaryKey(),
  seed: blob().$type<Uint8Array>().notNull(),
});
