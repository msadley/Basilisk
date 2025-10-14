// packages/core/src/database.ts

import {
  createFile,
  getHomePath,
  getPeerId,
  log,
  overrideJsonField,
  readJson,
  validateFile,
  writeJson,
} from "@basilisk/utils";
import path from "path";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

interface Database {
  id: string;
  messages: savedMessage[];
}

const defaultDatabase = (): Database => ({
  id: "",
  messages: [],
});

export interface Message {
  id?: number;
  content: string;
  timestamp: number;
  from: string;
  to: string;
}

interface savedMessage extends Message {
  id: number;
}

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

async function ensureDatabaseFile(id: string) {
  id = getId(id);
  const path: string = getDatabasePath(id);
  if (!(await validateFile(path))) {
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
  let messages: savedMessage[] = (await readJson(path))["messages"];
  let newId: number = 0;
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    newId = lastMessage ? lastMessage.id + 1 : 1;
  }
  message.id = newId;
  messages.push(message as savedMessage);
  await overrideJsonField(path, "messages", messages);
}

export async function retrieveMessages(id: string): Promise<Message[]> {
  id = getId(id);
  await ensureDatabaseFile(id);
  const path: string = getDatabasePath(id);
  return (await readJson(path))["messages"];
}
