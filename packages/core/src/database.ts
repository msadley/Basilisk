// packages/core/src/database.ts

import {
  createFile,
  getHomePath,
  overrideJsonField,
  readJson,
  validateFile,
} from "@basilisk/utils";
import path from "path";

interface Database {
  id: string;
  messages: Message[];
}

export const defaultDatabase = (): Database => ({
  id: "",
  messages: [],
});

export interface Message {
  id?: string;
  content: string;
  timestamp: number;
  from: string;
  to: string;
}

function getDatabasePath(id: string): string {
  return path.join(getHomePath(), `databases/${id}`);
}

async function ensureDatabaseFile(id: string) {
  const path: string = getDatabasePath(id);
  if (!(await validateFile(path))) {
    createFile(path);
    overrideJsonField(path, "id", id);
  }
}

export async function saveMessage(message: Message, id: string) {
  ensureDatabaseFile(id);
  const database = (await readJson(getDatabasePath(id))) as Database;
  addMessageToDatabase(message, database);
}

async function addMessageToDatabase(message: Message, database: Database) {
  const path: string = getDatabasePath(database["id"]);
  let messages: Message[] = (await readJson(path))["messages"];
  messages.push(message);
  overrideJsonField(path, "messages", messages);
}

export async function retrieveMessages(id: string): Promise<Message[]> {
  ensureDatabaseFile(id);
  const path: string = getDatabasePath(id);
  return (await readJson(path))["messages"];
}
