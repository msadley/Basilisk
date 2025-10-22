// packages/core/src/database.ts

import {
  absolutePath,
  ensureDirectoryExists,
  getHomeDatabasePath,
  log,
} from "@basilisk/utils";
import Database from "better-sqlite3";
import type { Chat, Message, MessagePacket, Profile } from "../types.js";
import path from "path";
import { getId } from "../profile/profile.js";

let db: Database.Database;

async function getDb(): Promise<Database.Database> {
  if (!db) {
    await ensureDirectoryExists(getHomeDatabasePath());
    db = new Database(
      absolutePath(path.join(getHomeDatabasePath(), "database.db"))
    );
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export async function ensureDatabase() {
  createDatabase();
}

async function createDatabase() {
  log("INFO", "Creating database tables if they don't exist...");
  const db = await getDb();
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
  log("INFO", "Database schema is up to date.");
}

async function upsertProfile(profile: Profile) {
  const db = await getDb();
  const stmt = db.prepare(
    "INSERT INTO profiles (id, name, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
  );
  stmt.run(profile.id, profile.name, profile.avatar);
}

async function upsertChat(chat: Chat) {
  const db = await getDb();
  const stmt = db.prepare(
    "INSERT INTO chats (id, name, avatar, type) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
  );
  stmt.run(chat.id, chat.name, chat.avatar, chat.type);
}

export async function saveMessage(message: MessagePacket) {
  await ensureDatabase();
  const db = await getDb();
  const id = await getChatId(message);

  if (!id.includes("group-")) await upsertProfile(message.from);

  await upsertChat({
    id: id,
    name: message.from.name ?? message.to,
    avatar: message.from.avatar ?? "",
    type: id.includes("group-") ? "group" : "private",
  });

  const stmt = db.prepare(
    "INSERT INTO messages (chat_id, from_id, content, timestamp) VALUES (?, ?, ?, ?)"
  );
  stmt.run(id, message.from.id, message.content, message.timestamp);
  log("INFO", `Message from ${message.from.id} saved to chat ${message.to}`);
}

async function getChatId(message: MessagePacket): Promise<string> {
  if (message.to.includes("group-")) return message.to;
  if (message.to === (await getId())) return message.from.id;
  return message.to;
}

export async function getMessages(
  peerId: string,
  limit: number,
  offset: number
): Promise<Message[]> {
  await ensureDatabase();
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT id, content, timestamp, from_id as 'from' FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?"
  );
  const messages = stmt.all(peerId, limit, offset) as Message[];
  return messages;
}

export async function getMessage(
  peerId: string,
  msgId: number
): Promise<Message> {
  await ensureDatabase();
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT id, content, timestamp, from_id as 'from' FROM messages WHERE chat_id = ? AND id = ?"
  );
  const message = stmt.get(peerId, msgId) as Message | undefined;

  if (!message) {
    throw new Error(`Message with id ${msgId} not found in chat ${peerId}`);
  }

  return message;
}

export async function getChats(): Promise<Chat[]> {
  await ensureDatabase();
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT id, name, avatar, type FROM chats ORDER BY id"
  );
  const chats = stmt.all() as Chat[];
  return chats;
}

export async function getChatMembers(chatId: string): Promise<Profile[]> {
  await ensureDatabase();
  const db = await getDb();
  const stmt = db.prepare(`
    SELECT p.id, p.name, p.avatar
    FROM profiles p
    JOIN chat_members cm ON p.id = cm.profile_id
    WHERE cm.chat_id = ?
  `);
  const members = stmt.all(chatId) as Profile[];
  return members;
}
