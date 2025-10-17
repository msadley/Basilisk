// packages/core/src/config.ts

import path from "path";
import {
  ensureFileExists,
  getHomePath,
  overrideJsonField,
} from "@basilisk/utils";
import { readJson, writeJson, log } from "@basilisk/utils";
import { generatePrivateKey } from "./keys.js";
import type { Config } from "../types.js";

const CONFIG_FILE: string = "config.json";

function getConfigFile(): string {
  return path.join(getHomePath(), CONFIG_FILE);
}

export const defaultConfig = (): Config => ({
  privateKey: "to-be-generated",
});

export async function validateConfigFile() {
  await log("INFO", "Validating config file...");
  if (!(await ensureFileExists(getConfigFile()))) await setDefaultConfig();

  const data = await readJson(getConfigFile());
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
    await writeJson(getConfigFile(), defaultConfig());
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

export async function overrideConfigField(field: string, value: any) {
  try {
    await overrideJsonField(getConfigFile(), field, value);
  } catch (error: any) {
    console.error("An error occurred: ", error);
  }
}

export async function getConfigField(field: string) {
  try {
    const data = await readJson(getConfigFile());
    return data[field];
  } catch (error: any) {
    console.error("An error occurred: ", error);
  }
}
