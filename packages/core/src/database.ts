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

function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call init() first.");
  }
  return db;
}

export async function createSchema(): Promise<void> {
  console.log("INFO: Creating database tables if they don't exist...");
  const db = getDb();
  await db.run(`
    CREATE TABLE IF NOT EXISTS settings (
    );

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

export async function upsertProfile(profile: Profile): Promise<number> {
  const db = getDb();

  return db.run(
    "INSERT INTO profiles (id, name, avatar) VALUES (@id, @name, @avatar) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar",
    {
      id: profile.id,
      name: profile.name || "",
      avatar: profile.avatar || "",
    }
  );
}

export async function upsertChat(
  chat: Chat
): Promise<{ changes: number; created: boolean }> {
  const db = getDb();
  const existing = await db.get("SELECT id FROM chats WHERE id = ?", [chat.id]);

  if (existing) {
    const changes = await db.run(
      "UPDATE chats SET name = @name, avatar = @avatar, type = @type WHERE id = @id",
      {
        id: chat.id,
        name: chat.name,
        avatar: chat.avatar,
        type: chat.type,
      }
    );
    return { changes, created: false };
  }

  const changes = await db.run(
    "INSERT INTO chats (id, name, avatar, type) VALUES (@id, @name, @avatar, @type)",
    { id: chat.id, name: chat.name, avatar: chat.avatar, type: chat.type }
  );
  return { changes, created: true };
}

export async function saveMessage(message: MessagePacket): Promise<void> {
  const chatId = await getChatId(message);
  const chatType = chatId.includes("group-") ? "group" : "private";

  const profileUpdated = await upsertProfile(message.from);

  const chatCreated = await upsertChat({
    id: chatId,
    name: message.from.name ?? message.to,
    avatar: message.from.avatar ?? "",
    type: chatType,
  });

  if (profileUpdated) databaseEvents.emit("profile:update", message.from);

  if (chatCreated) {
    databaseEvents.emit("chat:start", {
      id: chatId,
      name: message.from.name ?? message.to,
      avatar: message.from.avatar ?? "",
      type: chatType,
    });
  }

  const db = getDb();

  await db.run(
    "INSERT INTO messages (chat_id, from_id, content, timestamp) VALUES (?, ?, ?, ?)",
    [chatId, message.from.id, message.content, message.timestamp]
  );

  const savedMessage = await db.get<Message>(
    "SELECT id, content, timestamp, from_id as 'from', chat_id as 'chat' FROM messages WHERE chat_id = ? AND from_id = ? AND content = ? AND timestamp = ? ORDER BY id DESC LIMIT 1",
    [chatId, message.from.id, message.content, message.timestamp]
  );

  console.log(`INFO: Message from ${message.from.id} saved to chat ${chatId}`);

  if (savedMessage) {
    databaseEvents.emit("message:register", savedMessage);
  } else {
    console.error(
      "Could not retrieve the message immediately after saving it."
    );
  }
}

async function getChatId(message: MessagePacket): Promise<string> {
  if (message.to.includes("group-")) return message.to;
  const myId = await getId();
  if (message.to === myId) return message.from.id;
  return message.to;
}

export async function getMyProfile(): Promise<Profile> {
  const db = getDb();
  const profile: Profile | undefined = await db.get<Profile>(
    "SELECT id, name, avatar FROM profiles LIMIT 1"
  );
  if (!profile) {
    throw new Error("Profile not found in the database.");
  }
  return profile;
}

export async function getMessages(
  peerId: string,
  page: number
): Promise<Message[]> {
  const db = getDb();
  const limit = 20;
  const offset = (Math.max(1, page) - 1) * limit;
  return db.all<Message>(
    "SELECT id, content, timestamp, from_id as 'from', chat_id as 'chat' FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?",
    [peerId, limit, offset]
  );
}

export async function getMessage(
  peerId: string,
  msgId: number
): Promise<Message> {
  const db = getDb();
  const message = await db.get<Message>(
    "SELECT id, content, timestamp, from_id as 'from', chat_id as 'chat' FROM messages WHERE chat_id = ? AND id = ?",
    [peerId, msgId]
  );

  if (!message) {
    throw new Error(`Message with id ${msgId} not found in chat ${peerId}`);
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

export async function getId(): Promise<string> {
  return (await getMyProfile()).id;
}
