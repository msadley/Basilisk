// src/config/config.ts

import { generatePrivateKey, validateFile } from "../util/util.js";
import { readJson, writeJson } from "../util/json.js";

export const CONFIG_FILE = "config/config.json";

interface Config {
  privateKey: string;
}

export const defaultConfig = (): Config => ({
  privateKey: "to-be-generated",
});

export async function validateConfigFile() {
  if (!(await validateFile(CONFIG_FILE))) await setDefaultConfig();

  const data = await readJson(CONFIG_FILE);
  if (
    data["privateKey"] === undefined ||
    data["privateKey"] === "" ||
    data["privateKey"] === "to-be-generated"
  )
    await generatePrivateKey();
}

async function setDefaultConfig() {
  try {
    await writeJson(CONFIG_FILE, defaultConfig());
  } catch (error: any) {
    console.error("An error occurred: ", error);
  }
}
