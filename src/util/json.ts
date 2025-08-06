// src/util/json.ts

import { CONFIG_FILE } from "../app/app.js";
import { absolutePath } from "./util.js";
import fs from "fs";

export async function getBootstrapAddresses() {
  try {
    const data = await readJsonFile(CONFIG_FILE);
    return data["saved-addresses"];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      const defaultData = { "saved-addresses": [] };
      fs.writeFileSync(
        absolutePath(CONFIG_FILE),
        JSON.stringify(defaultData, null, 2)
      );
      return [];
    }
  }
}

export async function writeJsonFile(file: string, data: any) {
  try {
    file = absolutePath(file);
    const jsonString = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(file, jsonString, "utf-8");
  } catch (err: any) {
    console.error("An error occurred:", err);
  }
}

export async function readJsonFile(file: string) {
  try {
    file = absolutePath(file);
    const jsonString = await fs.promises.readFile(file, "utf-8");
    const data = JSON.parse(jsonString);
    return data;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.error(`Error: The file '${file}' was not found.`);
    } else {
      console.error("An error occurred:", err);
    }
  }
}

export async function getPrivateKeyRaw() {
  const data = await readJsonFile(CONFIG_FILE);
  if (data["privateKey"] === undefined)
    throw new Error("Private key not found in config file.");

  return data["privateKey"];
}
