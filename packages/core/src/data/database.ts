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
  validatePath,
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
  // Extracts the peerId from the multiaddrs for a more reliable id
  try {
    const addr: Multiaddr = multiaddr(data);
    const id: string | undefined = getPeerId(addr);
    return id ? id : "";
  } catch (error: any) {
    return data;
  }
}

function getDatabasePath(id: string): string {
  return path.join(getHomePath(), `databases/${id}.db`);
}

async function ensureDatabasePath() {
  const path: string = getHomeDatabasePath();
  if (!(await validatePath(path))) {
  }
}

async function ensureDatabaseFile(id: string) {
  id = getId(id);
  const path: string = getDatabasePath(id);
  if (!(await validatePath(path))) {
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
  const file: string = getDatabasePath(id);
  await createFile(file);
  await writeJson(file, defaultDatabase());
}

export async function saveMessage(message: Message, id: string) {
  id = getId(id);
  await ensureDatabaseFile(id);
  const path: string = getDatabasePath(id);
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
  const path: string = getDatabasePath(id);
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
  return (await readJson(getDatabasePath(id))) as Database;
}
