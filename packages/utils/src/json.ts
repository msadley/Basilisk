// packages/utils/src/json.ts

import { absolutePath } from "./file.js";
import fs from "fs";

export async function writeJson(file: string, data: any) {
  file = absolutePath(file);
  const jsonString = JSON.stringify(data, null, 2);
  await fs.promises.mkdir(absolutePath("config/"), { recursive: true });
  await fs.promises.writeFile(file, jsonString, "utf-8");
}

export async function readJson(file: string): Promise<any> {
  file = absolutePath(file);
  const jsonString = await fs.promises.readFile(file, "utf-8");
  return JSON.parse(jsonString);
}
