// src/util/log.ts

import { absolutePath, validateFile } from "./util.js";
import fs from "fs";

const LOG_FILE = `/log/${getCurrentTimestamp("COMPACT")}.log`;

function getCurrentTimestamp(mode: "FULL" | "COMPACT"): string {
  const now = new Date();
  const pad = (num: number): string => num.toString().padStart(2, "0");

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  if (mode === "FULL")
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  else
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

export async function log(level: "INFO" | "WARN" | "ERROR", message: string) {
  await validateFile(LOG_FILE);

  await fs.promises.appendFile(
    absolutePath(LOG_FILE),
    `[${getCurrentTimestamp("FULL")}] [${level}] ${message}\n`
  );
}