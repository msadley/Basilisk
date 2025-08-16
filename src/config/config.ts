// src/config/config.ts

import { generatePrivateKey, validateFile } from "../util/util.js";
import { readJson, writeJson } from "../util/json.js";
import { log } from "../util/log.js";

export const CONFIG_FILE = "config/config.json";

interface Config {
  privateKey: string;
}

export const defaultConfig = (): Config => ({
  privateKey: "to-be-generated",
});

export async function validateConfigFile() {
  await log("INFO", "Validating config file...");
  if (!(await validateFile(CONFIG_FILE))) await setDefaultConfig();

  const data = await readJson(CONFIG_FILE);
  if (
    data["privateKey"] === undefined ||
    data["privateKey"] === "" ||
    data["privateKey"] === "to-be-generated"
  )
    await generatePrivateKey();

  await log("INFO", "Config file validated");
}

async function setDefaultConfig() {
  await log("INFO", "Setting default config...");
  try {
    await writeJson(CONFIG_FILE, defaultConfig());
    await log("INFO", "Default config set.");
  } catch (error: any) {
    await log(
      "ERROR",
      "An error occurred while setting the default config: " + error.message
    );
    console.error(
      "An error occurred while setting the default config: ",
      error
    );
  }
}
