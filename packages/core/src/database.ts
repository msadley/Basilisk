// packages/core/src/database.ts

import Database from "better-sqlite3";
import type { Chat, Message, MessagePacket, Profile } from "../types.js";

let db: Database.Database;

/**
 * Initializes the database module with a better-sqlite3 database instance.
 * This should be called by the main class before any other database function.
 * @param database The better-sqlite3 database instance.
 */
export function setDb(database: Database.Database) {
  db = database;
  db.pragma("journal_mode = WAL");
}

function getDb(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call init() first.");
  }
  return db;
}

export function createSchema() {
  console.log("INFO: Creating database tables if they don't exist...");
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      type TEXT NOT NULL CHECK(type IN ('private', 'group'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      from_id TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id),
      FOREIGN KEY (from_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      PRIMARY KEY (chat_id, profile_id),
      FOREIGN KEY (chat_id) REFERENCES chats(id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );
  `);
  console.log("INFO: Database schema is up to date.");
}

export function upsertProfile(profile: Profile) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO profiles (id, name, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
  );
  stmt.run(profile.id, profile.name, profile.avatar);
}

export function upsertChat(chat: Chat) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO chats (id, name, avatar, type) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
  );
  stmt.run(chat.id, chat.name, chat.avatar, chat.type);
}

/**
 * Saves a message packet to the database.
 * This operation is transactional, ensuring that the profile, chat, and message are all saved correctly.
 * @param message The message packet to save.
 */
export async function saveMessage(message: MessagePacket): Promise<void> {
  const db = getDb();
  const chatId = await getChatId(message);

  const saveTx = db.transaction(() => {
    const upsertProfileStmt = db.prepare(
      "INSERT INTO profiles (id, name, avatar) VALUES (@id, @name, @avatar) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
    );
    upsertProfileStmt.run(message.from);

    const upsertChatStmt = db.prepare(
      "INSERT INTO chats (id, name, avatar, type) VALUES (@id, @name, @avatar, @type) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
    );
    upsertChatStmt.run({
      id: chatId,
      name: message.from.name ?? message.to,
      avatar: message.from.avatar ?? "",
      type: chatId.includes("group-") ? "group" : "private",
    });

    const insertMessageStmt = db.prepare(
      "INSERT INTO messages (chat_id, from_id, content, timestamp) VALUES (?, ?, ?, ?)"
    );
    insertMessageStmt.run(
      chatId,
      message.from.id,
      message.content,
      message.timestamp
    );
  });

  saveTx();
  console.log(`INFO: Message from ${message.from.id} saved to chat ${chatId}`);
}

function getChatId(message: MessagePacket): Promise<string> {
  if (message.to.includes("group-")) return message.to;
  const myId = getId();
  if (message.to === myId) return message.from.id;
  return message.to;
}

export function getMyProfile(): Profile | undefined {
  const db = getDb();
  const stmt = db.prepare("SELECT id, name, avatar FROM profiles LIMIT 1");
  return stmt.get() as Profile | undefined;
}

export function getMessages(
  peerId: string,
  limit: number,
  offset: number
): Message[] {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT id, content, timestamp, from_id as 'from' FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?"
  );
  const messages = stmt.all(peerId, limit, offset) as Message[];
  return messages;
}

export function getMessage(peerId: string, msgId: number): Message {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT id, content, timestamp, from_id as 'from' FROM messages WHERE chat_id = ? AND id = ?"
  );
  const message = stmt.get(peerId, msgId) as Message | undefined;

  if (!message) {
    throw new Error(`Message with id ${msgId} not found in chat ${peerId}`);
  }

  return message;
}

export function getChats(): Chat[] {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT id, name, avatar, type FROM chats ORDER BY id"
  );
  const chats = stmt.all() as Chat[];
  return chats;
}

export function getChatMembers(chatId: string): Profile[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT p.id, p.name, p.avatar
    FROM profiles p
    JOIN chat_members cm ON p.id = cm.profile_id
    WHERE cm.chat_id = ?
  `);
  const members = stmt.all(chatId) as Profile[];
  return members;
}

export function getId(): string {
  const profile = getMyProfile();
  if (!profile) throw new Error("User profile not found in the database.");
  return profile.id;
}
