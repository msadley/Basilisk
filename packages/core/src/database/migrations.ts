import { sql } from "drizzle-orm";
import type { AppDatabase } from "../types.js";

/**
 * Idempotent SQLite initialization statements matching the Drizzle schema.
 * PRAGMA foreign_keys is enabled per connection, followed by CREATE TABLE IF NOT EXISTS
 * statements ordered so referenced tables precede referencing tables.
 */
export const DATABASE_INIT_STATEMENTS: readonly string[] = [
  "PRAGMA foreign_keys = ON;",
  `CREATE TABLE IF NOT EXISTS \`identity\` (
\t\`id\` integer PRIMARY KEY NOT NULL,
\t\`seed\` blob NOT NULL
);`,
  `CREATE TABLE IF NOT EXISTS \`profiles\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text,
\t\`avatar\` blob
);`,
  `CREATE TABLE IF NOT EXISTS \`chats\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`is_group\` integer NOT NULL,
\t\`name\` text,
\t\`image\` blob,
\tCONSTRAINT "name_required_on_group" CHECK("chats"."is_group" = 0 OR "chats"."name" IS NOT NULL)
);`,
  `CREATE TABLE IF NOT EXISTS \`messages\` (
\t\`id\` integer PRIMARY KEY NOT NULL,
\t\`chat_id\` text NOT NULL,
\t\`sender_id\` text NOT NULL,
\t\`content_type\` text NOT NULL,
\t\`content\` blob NOT NULL,
\t\`timestamp\` integer NOT NULL,
\t\`received\` integer DEFAULT false NOT NULL,
\tFOREIGN KEY (\`chat_id\`) REFERENCES \`chats\`(\`id\`) ON UPDATE no action ON DELETE cascade,
\tFOREIGN KEY (\`sender_id\`) REFERENCES \`profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade
);`,
  `CREATE TABLE IF NOT EXISTS \`chat_participants\` (
\t\`chat_id\` text NOT NULL,
\t\`user_id\` text NOT NULL,
\tPRIMARY KEY(\`chat_id\`, \`user_id\`),
\tFOREIGN KEY (\`chat_id\`) REFERENCES \`chats\`(\`id\`) ON UPDATE no action ON DELETE cascade,
\tFOREIGN KEY (\`user_id\`) REFERENCES \`profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade
);`,
];

export async function initializeDatabase(db: AppDatabase): Promise<void> {
  for (const statement of DATABASE_INIT_STATEMENTS) {
    await db.run(sql.raw(statement));
  }
}
