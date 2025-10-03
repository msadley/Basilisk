// packages/core/src/database.ts

import { getHomePath } from "@basilisk/utils";
import path from "path";

interface Database {
  id: string;
  type: "CHAT" | "GROUP";
  participants: string[];
  messages: Message[];
}

export interface Message {
  content: string | Buffer;
  timestamp: number;
  from: string;
  to: string;
}

const _databaseTemplate: string = "";

function getDatabasePath() {
  return path.join(getHomePath(), databaseTemplate);
}

export function saveMessage() {}
