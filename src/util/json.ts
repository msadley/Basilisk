// src/util/json.ts

import { CONFIG_FILE } from "../config/config.js";
import { absolutePath } from "./util.js";
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

export async function overrideConfig(field: string, value: any) {
  try {
    const data = await readJson(CONFIG_FILE);
    data[field] = value;
    await writeJson(CONFIG_FILE, data);
  } catch (error: any) {
    console.error("An error occurred: ", error);
  }
}

export async function getPrivateKeyRaw(): Promise<string> {
  const data = await readJson(CONFIG_FILE);
  if (data["privateKey"] === undefined || data["privateKey"] === "")
    throw new Error("Private key not found in config file.");
  return data["privateKey"];
}
