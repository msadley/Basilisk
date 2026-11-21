import { relations, sql } from "drizzle-orm";
import {
  check,
  customType,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const textEncoder = new TextEncoder();

function toPlainUint8Array(value: Uint8Array): Uint8Array {
  if (
    typeof SharedArrayBuffer !== "undefined" &&
    value.buffer instanceof SharedArrayBuffer
  ) {
    return new Uint8Array(value);
  }
  return value.constructor === Uint8Array
    ? value
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

const uint8ArrayBlob = customType<{ data: Uint8Array; driverData: unknown }>({
  dataType() {
    return "blob";
  },
  toDriver(value: Uint8Array): Uint8Array {
    return toPlainUint8Array(value);
  },
  fromDriver(value: unknown): Uint8Array {
    if (value instanceof Uint8Array) {
      return toPlainUint8Array(value);
    }
    if (value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (
      typeof SharedArrayBuffer !== "undefined" &&
      value instanceof SharedArrayBuffer
    ) {
      return new Uint8Array(new Uint8Array(value));
    }
    if (ArrayBuffer.isView(value)) {
      return toPlainUint8Array(
        new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
      );
    }
    if (Array.isArray(value)) {
      return Uint8Array.from(value);
    }
    if (typeof value === "string") {
      return textEncoder.encode(value);
    }
    throw new TypeError(
      `Unsupported blob value from SQLite driver: ${typeof value}`,
    );
  },
});

export const identity = sqliteTable("identity", {
  id: integer("id").primaryKey(),
  seed: uint8ArrayBlob("seed").notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name"),
  avatar: uint8ArrayBlob("avatar"),
});

export const chats = sqliteTable(
  "chats",
  {
    id: text("id").primaryKey(),
    isGroup: integer("is_group", { mode: "boolean" }).notNull(),
    name: text("name"),
    image: uint8ArrayBlob("image"),
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
  content: uint8ArrayBlob("content").notNull(),
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
    profiles: one(profiles, {
      fields: [chatParticipants.userId],
      references: [profiles.id],
    }),
    chats: one(chats, {
      fields: [chatParticipants.chatId],
      references: [chats.id],
    }),
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
