import { relations, sql } from "drizzle-orm";
import {
  blob,
  check,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name"),
  avatar: blob("avatar").$type<Uint8Array>(),
});

export const chats = sqliteTable(
  "chats",
  {
    id: text("id").primaryKey(),
    isGroup: integer("is_group", { mode: "boolean" }).notNull(),
    name: text("name"),
    image: blob("image").$type<Uint8Array>(),
  },
  (table) => [
    check(
      "name_required_on_group",
      sql`${table.isGroup} = 0 OR ${table.name} IS NOT NULL`,
    ),
  ],
);

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  content: blob("content").$type<Uint8Array | string>().notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  received: integer("received", { mode: "boolean" }).notNull().default(false),
});

export const chatParticipants = sqliteTable(
  "chat_participants",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.userId] })],
);

export const profilesRelations = relations(profiles, ({ many }) => ({
  messages: many(messages),
  chatParticipants: many(chatParticipants),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
  chatParticipants: many(chatParticipants),
}));

export const chatParticipantsRelations = relations(
  chatParticipants,
  ({ one }) => ({
    profiles: one(profiles),
    chats: one(chats),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
  }),
}));
