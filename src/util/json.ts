// src/util/json.ts

import { CONFIG_FILE } from "../app/app.js";
import { absolutePath, generatePrivateKey } from "./util.js";
import { defaultConfig } from "../config/config.js";
import fs from "fs";

export async function validateConfigFile() {
  try {
    fs.promises.access(absolutePath(CONFIG_FILE));
    readJsonFile(CONFIG_FILE);
  } catch (error) {
    // File does not exist or is empty
    await setDefaultConfig();
  }

  const data = await readJsonFile(CONFIG_FILE);
  if (
    data["privateKey"] === undefined ||
    data["privateKey"] === "" ||
    data["privateKey"] === "to-be-generated"
  ) {
    await generatePrivateKey();
  } else if (
    !data["savedAddresses"] ||
    !Array.isArray(data["savedAddresses"])
  ) {
    overrideConfig("savedAddresses", ["ipv4/"]);
  }
}

async function setDefaultConfig() {
  try {
    await writeJsonFile(CONFIG_FILE, await defaultConfig());
  } catch (error: any) {
    console.error("An error occurred: ", error);
  }
}

export async function getBootstrapAddresses(): Promise<string[]> {
  const data = await readJsonFile(CONFIG_FILE);
  return data["savedAddresses"];
}

async function writeJsonFile(file: string, data: any) {
  file = absolutePath(file);
  const jsonString = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(file, jsonString, "utf-8");
}

async function readJsonFile(file: string): Promise<any> {
  file = absolutePath(file);
  const jsonString = await fs.promises.readFile(file, "utf-8");
  return JSON.parse(jsonString);
}

export async function overrideConfig(field: string, value: any) {
  try {
    const data = await readJsonFile(CONFIG_FILE);
    data[field] = value;
    await writeJsonFile(CONFIG_FILE, data);
  } catch (error: any) {
    console.error("An error occurred: ", error);
  }
}

export async function getPrivateKeyRaw(): Promise<string> {
  const data = await readJsonFile(CONFIG_FILE);
  if (data["privateKey"] === undefined || data["privateKey"] === "")
    throw new Error("Private key not found in config file.");
  return data["privateKey"];
}
