// packages/core/src/database.ts

import { getHomeDatabasePath, ensureFileExists, log } from "@basilisk/utils";
import Database from "better-sqlite3";
import type { Chat, Message, MessagePacket, Profile } from "../types.js";

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(getHomeDatabasePath());
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export async function ensureDatabase() {
  if (!(await ensureFileExists(getHomeDatabasePath())))
    createDatabase(getHomeDatabasePath());
}

function createDatabase(_dbPath: string) {
  log("INFO", "Creating new database with initial schema.");
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
  log("INFO", "Database created successfully.");
}

function upsertProfile(profile: Profile) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO profiles (id, name, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
  );
  stmt.run(profile.id, profile.name, profile.avatar);
}

function upsertChat(chat: Chat) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO chats (id, name, avatar, type) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar"
  );
  stmt.run(chat.id, chat.name, chat.avatar, chat.type);
}

export async function saveMessage(message: MessagePacket) {
  await ensureDatabase();
  const db = getDb();

  upsertProfile(message.from);
  upsertChat({
    id: message.to,
    name: message.from.name ?? message.to,
    avatar: message.from.avatar ?? "",
    type: "private", // TODO Assumindo privado por enquanto, precisará de lógica para grupos
  });

  const stmt = db.prepare(
    "INSERT INTO messages (chat_id, from_id, content, timestamp) VALUES (?, ?, ?, ?)"
  );
  stmt.run(message.to, message.from.id, message.content, message.timestamp);
  log("INFO", `Message from ${message.from.id} saved to chat ${message.to}`);
}

export async function getMessages(
  peerId: string,
  limit: number,
  offset: number
): Promise<Message[]> {
  await ensureDatabase();
  const db = getDb();
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

export async function getChats(): Promise<Chat[]> {
  await ensureDatabase();
  const db = getDb();
  const stmt = db.prepare(
    "SELECT id, name, avatar, type FROM chats ORDER BY id"
  );
  const chats = stmt.all() as Chat[];
  return chats;
}

export async function getChatMembers(chatId: string): Promise<Profile[]> {
  await ensureDatabase();
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
