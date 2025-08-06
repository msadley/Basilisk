// src/util/json.ts

import { CONFIG_FILE } from "../app/app.js";
import { absolutePath } from "./util.js";
import fs from "fs";

/**
 * Retrieves the list of bootstrap addresses from the configuration file.
 * @returns {Promise<string[]>} A promise that resolves to an array of bootstrap addresses.
 * @throws {Error} If the 'saved-addresses' field is not found in the config file.
 */
export async function getBootstrapAddresses() { 
    const data = await readJsonFile(CONFIG_FILE);
    if (data['saved-addresses'] === undefined) {
        throw new Error("No saved addresses found in config file.");
    return data["saved-addresses"];
  }
}

/**
 * Writes data to a JSON file.
 * @param {string} file - The path to the file.
 * @param {any} data - The data to write to the file.
 */
async function writeJsonFile(file: string, data: any) {
  try {
    file = absolutePath(file);
    const jsonString = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(file, jsonString, "utf-8");
  } catch (err: any) {
    console.error("An error occurred:", err);
  }
}

/**
 * Reads data from a JSON file.
 * @param {string} file - The path to the file.
 * @returns {Promise<any>} A promise that resolves to the data from the file.
 */
async function readJsonFile(file: string) {
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

/**
 * Overrides a field in the configuration file.
 * @param {string} field - The field to override.
 * @param {any} value - The new value for the field.
 */
export async function overrideConfig(field: string, value: any) {
  try {
    const data = await readJsonFile(CONFIG_FILE);
    data[field] = value;
    await writeJsonFile(CONFIG_FILE, data);
  } catch (error: any) {
    console.error("An error occurred while writing to the config file:", error);
  }
}

/**
 * Retrieves the raw private key from the configuration file.
 * @returns {Promise<string>} A promise that resolves to the raw private key.
 * @throws {Error} If the 'privateKey' field is not found in the config file.
 */
export async function getPrivateKeyRaw() {
  const data = await readJsonFile(CONFIG_FILE);
  if (data["privateKey"] === undefined)
    throw new Error("Private key not found in config file.");

  return data["privateKey"];
}