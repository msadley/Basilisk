// src/util/log.ts

import { absolutePath, validateFile } from "./util.js";
import fs from "fs";

const LOG_FILE = "/log/log.txt";

function getCurrentTimestamp() : string {
  const now = new Date();

  const pad = (num: number): string => num.toString().padStart(2, "0");

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export async function log(level: "INFO" | "WARN" | "ERROR", message: string) {
  validateFile(LOG_FILE);

  await fs.promises.appendFile(
    absolutePath(LOG_FILE),
    `[${getCurrentTimestamp}] [${level}] ${message}`
  );
}
