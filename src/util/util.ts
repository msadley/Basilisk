// src/util/util.ts

import path from "path";
import fs from "fs";
import appRootPath from "app-root-path";
import { getPrivateKeyRaw, overrideConfig } from "./json.js";
import { generateKeyPair, privateKeyFromRaw } from "@libp2p/crypto/keys";

export function absolutePath(file: string): string {
  return path.join(appRootPath.path, file);
}

/**
 * Returns false if the file wasn't valid else returns true
 */
export async function validateFile(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(absolutePath(filePath));
  } catch (error: any) {
    await createFile(filePath);
    return false;
  }
  return true;
}

export async function createFile(filePath: string) {
  await fs.promises.mkdir(absolutePath(path.dirname(filePath)), {
    recursive: true,
  });
  await fs.promises.writeFile(absolutePath(filePath), "");
}

export async function getPrivateKey(): Promise<any> {
  let data: string;
  try {
    data = await getPrivateKeyRaw();
  } catch (error: any) {
    await generatePrivateKey();
    data = await getPrivateKeyRaw();
  }
  return privateKeyFromRaw(new Uint8Array(Buffer.from(data, "hex")));
}

/**
 * Generates a new private key and saves it to the config file.
 */
export async function generatePrivateKey() {
  const privateKey = await generateKeyPair("Ed25519");
  await overrideConfig(
    "privateKey",
    Buffer.from(privateKey.raw).toString("hex")
  );
}
