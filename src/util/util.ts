// src/util/util.ts

import path from "path";
import appRootPath from "app-root-path";
import { getPrivateKeyRaw, overrideConfig } from "./json.js";
import { generateKeyPair, privateKeyFromRaw } from "@libp2p/crypto/keys";

/**
 * Returns the absolute path of a file.
 * @param {string} file - The file to get the absolute path of.
 * @returns {string} The absolute path of the file.
 */
export function absolutePath(file: string): string {
  return path.join(appRootPath.path, file);
}

/**
 * Gets the private key from the config file, or generates a new one if it doesn't exist.
 * @returns {Promise<any>} A promise that resolves to the private key.
 */
export async function getPrivateKey(): Promise<any> {
  let data;
  try {
    data = await getPrivateKeyRaw();
  } catch (error) {
    await generatePrivateKey();
    data = await getPrivateKeyRaw();
  }

  return privateKeyFromRaw(new Uint8Array(Buffer.from(data, "hex")));
}

/**
 * Generates a new private key and saves it to the config file.
 */
async function generatePrivateKey() {
  const privateKey = await generateKeyPair("Ed25519");
  console.log(
    "Generated new private key:",
    Buffer.from(privateKey.raw).toString("hex")
  );
  await overrideConfig(
    "privateKey",
    Buffer.from(privateKey.raw).toString("hex")
  );
}
