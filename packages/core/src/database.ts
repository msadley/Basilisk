import { EventEmitter } from "events";
import type {
  Chat,
  Database,
  Message,
  MessagePacket,
  Profile,
} from "./types.js";

let db: Database;

export const databaseEvents = new EventEmitter();

export function setDb(database: Database) {
  db = database;
}

export function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call init() first.");
  }
  return db;
}

export async function createSchema(): Promise<void> {
  const db = getDb();
  await db.run(`
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
      uuid TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      from_id TEXT,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      chat_id TEXT NOT NULL,
      profile_id TEXT
    )
  `);
}

export async function upsertProfile(profile: Profile): Promise<number> {
  const db = getDb();

  return await db.run(
    "INSERT INTO profiles (id, name, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar",
    [profile.id, profile.name, profile.avatar]
  );
}

export async function upsertChat(chat: Chat): Promise<number> {
  const db = getDb();
  if (chat.type === "group") {
    return await db.run(
      "INSERT INTO chats (id, name, avatar, type) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar",
      [chat.id, chat.name, chat.avatar, chat.type]
    );
  } else {
    return await db.run("INSERT INTO chats (id, type) VALUES (?, ?)", [
      chat.id,
      chat.type,
    ]);
  }
}

/* async function chatExists(chatId: string): Promise<boolean> {
  const db = getDb();

  const result = await db.get<{ id: string }>(
    "SELECT id FROM CHATS WHERE id = ?",
    [chatId]
  );

  return result !== undefined;
} */

export async function saveMessage(message: MessagePacket): Promise<void> {
  const db = getDb();

  const chatId = await getChatId(message);
  const type = chatType(chatId);

  try {
    await db.run("INSERT INTO chats (id, type) VALUES (?, ?)", [chatId, type]);
    const chat = { id: chatId, type };
    databaseEvents.emit("chat:spawn", chat);
  } catch (e: any) {
    if (!e.message.includes("SQLITE_CONSTRAINT_FOREIGNKEY")) console.error(e);
  }

  await db.run(
    "INSERT INTO messages (uuid, chat_id, from_id, content) VALUES (?, ?, ?, ?)",
    [message.uuid, chatId, message.from, message.content]
  );
}

async function getChatId(message: MessagePacket): Promise<string> {
  if (message.chatId.includes("group-")) return message.chatId;
  const myId = await getId();
  if (message.chatId === myId) return message.from;
  return message.chatId;
}

export function chatType(id: string): "private" | "group" {
  if (id.includes("group-")) return "group";
  return "private";
}

export async function getMyProfile(): Promise<Profile> {
  const db = getDb();
  const profile: Profile | undefined = await db.get<Profile>(
    "SELECT id, name, avatar FROM profiles LIMIT 1"
  );
  if (!profile || profile.id === "") {
    throw new Error("Profile not found in the database.");
  }
  return profile;
}

export async function setMyProfile(
  id: string,
  name?: string,
  avatar?: string
): Promise<void> {
  const db = getDb();
  await db.run(
    "INSERT OR REPLACE INTO profiles (id, name, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar",
    [id, name, avatar]
  );
}

export async function getMessages(
  peerId: string,
  page: number
): Promise<Message[]> {
  const db = getDb();
  const limit = 20;
  const offset = (Math.max(1, page) - 1) * limit;
  return db.all<Message>(
    "SELECT uuid, content, from_id as 'from', chat_id as 'chat' FROM messages WHERE chat_id = ? ORDER BY uuid DESC LIMIT ? OFFSET ?",
    [peerId, limit, offset]
  );
}

export async function getMessage(
  peerId: string,
  msgId: number
): Promise<Message> {
  const db = getDb();
  const message = await db.get<Message>(
    "SELECT uuid, content, from_id as 'from', chat_id as 'chat' FROM messages WHERE chat_id = ? AND uuid = ?",
    [peerId, msgId]
  );

  if (!message) {
    throw new Error(`Message with uuid ${msgId} not found in chat ${peerId}`);
  }
  return message;
}

export async function getChats(): Promise<Chat[]> {
  const db = getDb();
  return db.all<Chat>("SELECT id, name, avatar, type FROM chats ORDER BY id");
}

export async function getChatMembers(chatId: string): Promise<Profile[]> {
  const db = getDb();
  return db.all<Profile>(
    `
    SELECT p.id, p.name, p.avatar
    FROM profiles p
    JOIN chat_members cm ON p.id = cm.profile_id
    WHERE cm.chat_id = ?
  `,
    [chatId]
  );
}

/**
 * @returns the node's peerID
 */
export async function getId(): Promise<string> {
  return (await getMyProfile()).id;
}
