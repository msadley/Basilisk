// packages/core/src/database.ts

import {
  createFile,
  getHomeDatabasePath,
  getHomePath,
  log,
  overrideJsonField,
  readJson,
  searchFiles,
  ensureFileExists,
  ensureDirectoryExists,
  writeJson,
} from "@basilisk/utils";
import path from "path";
import type { Database, Message, MessagePacket, Profile } from "../types.js";

const defaultDatabase = (): Database => ({
  profile: { id: "" },
  messages: [],
});

function packetToMessage(packet: MessagePacket, newId: number): Message {
  return {
    id: newId,
    content: packet.content,
    timestamp: packet.timestamp,
    from: packet.from.id,
  };
}

async function getDatabasePath(id: string): Promise<string> {
  const databasePath = path.join(getHomePath(), `databases/${id}.db`);
  await ensureDirectoryExists(path.dirname(databasePath));
  return databasePath;
}

async function ensureDatabasePath() {
  await ensureDirectoryExists(getHomeDatabasePath());
}

export async function ensureDatabaseFile(id: string, profile: Profile) {
  const path: string = await getDatabasePath(id);
  if (!(await ensureFileExists(path))) {
    await log("INFO", "Creating template database...");
    await setDefaultDatabase(id);
    await overrideJsonField(path, "profile", profile);
  } else {
    try {
      readJson(path);
    } catch (error: any) {
      await log("WARN", `Error when parsing database file: ${error}`);
      await log("INFO", "Creating template database...");
      await setDefaultDatabase(id);
      await overrideJsonField(path, "profile", profile);
    }
  }
}

async function setDefaultDatabase(id: string) {
  const file: string = await getDatabasePath(id);
  await createFile(file);
  await writeJson(file, defaultDatabase());
}

export async function saveMessage(message: MessagePacket, id: string) {
  await ensureDatabaseFile(id, message.from);
  const path: string = await getDatabasePath(id);

  let messages: Message[] = (await readJson(path))["messages"];
  const lastId = messages[messages.length - 1]?.id ?? -1;
  messages.push(packetToMessage(message, lastId + 1));
  await overrideJsonField(path, "messages", messages);
  await overrideJsonField(path, "profile", message.from);
}

export async function getMessages(id: string): Promise<Message[]> {
  const path: string = await getDatabasePath(id);
  return (await readJson(path))["messages"];
}

export async function getMessage(id: string, msg: number): Promise<Message> {
  const database: Database = await getDatabase(id);
  const message = database.messages.find((message) => message.id === msg);
  if (message) {
    return message;
  } else {
    throw new Error("Message not found");
  }
}

export async function listDatabases(): Promise<Profile[]> {
  await log("INFO", "Getting databases...");
  await ensureDatabasePath();
  const databaseFiles = await searchFiles(getHomeDatabasePath());

  const databases: Database[] = (await Promise.all(
    databaseFiles.map((file) => readJson(file))
  )) as Database[];

  const profiles: Profile[] = await Promise.all(
    databases.map((database: Database) => database.profile)
  );
  return profiles;
}

export async function getDatabase(id: string) {
  return (await readJson(await getDatabasePath(id))) as Database;
}
