// packages/core/src/database.ts

import {
  createFile,
  getHomeDatabasePath,
  getHomePath,
  getPeerId,
  log,
  overrideJsonField,
  readJson,
  searchFiles,
  ensureFileExists,
  ensureDirectoryExists,
  writeJson,
} from "@basilisk/utils";
import path from "path";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import type { Database, Message, SavedMessage } from "../types.js";

const defaultDatabase = (): Database => ({
  id: "",
  messages: [],
});

export function getId(data: string): string {
  try {
    const addr: Multiaddr = multiaddr(data);
    const id: string | undefined = getPeerId(addr);
    return id ? id : "";
  } catch (error: any) {
    return data;
  }
}

async function getDatabasePath(id: string): Promise<string> {
  const databasePath = path.join(getHomePath(), `databases/${id}.db`);
  await ensureDirectoryExists(path.dirname(databasePath));
  return databasePath;
}

async function ensureDatabasePath() {
  await ensureDirectoryExists(getHomeDatabasePath());
}

async function ensureDatabaseFile(id: string) {
  id = getId(id);
  const path: string = await getDatabasePath(id);
  if (!(await ensureFileExists(path))) {
    await log("INFO", "Creating template database...");
    await setDefaultDatabase(id);
    await overrideJsonField(path, "id", id);
  } else {
    try {
      readJson(path);
    } catch (error: any) {
      await log("WARN", `Error when parsing database file: ${error}`);
      await log("INFO", "Creating template database...");
      await setDefaultDatabase(id);
      await overrideJsonField(path, "id", id);
    }
  }
}

async function setDefaultDatabase(id: string) {
  const file: string = await getDatabasePath(id);
  await createFile(file);
  await writeJson(file, defaultDatabase());
}

export async function saveMessage(message: Message, id: string) {
  await ensureDatabaseFile(id);
  const path: string = await getDatabasePath(id);
  let messages: SavedMessage[] = (await readJson(path))["messages"];
  let newId: number = 0;
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    newId = lastMessage ? lastMessage.id + 1 : 1;
  }
  message.id = newId;
  messages.push(message as SavedMessage);
  await overrideJsonField(path, "messages", messages);
}

export async function getMessages(id: string): Promise<Message[]> {
  id = getId(id);
  await ensureDatabaseFile(id);
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

export async function getDatabases(): Promise<string[]> {
  await log("INFO", "Getting databases...");
  await ensureDatabasePath();
  const databaseFiles = await searchFiles(getHomeDatabasePath());

  const databases: Database[] = (await Promise.all(
    databaseFiles.map((file) => readJson(file))
  )) as Database[];

  const databaseIds: string[] = await Promise.all(
    databases.map((database: Database) => database.id)
  );
  return databaseIds;
}

export async function getDatabase(id: string) {
  return (await readJson(await getDatabasePath(id))) as Database;
}
