// packages/core/src/keys.ts

import { readJson } from "@basilisk/utils";
import { generateKeyPair, privateKeyFromRaw } from "@libp2p/crypto/keys";
import type { PrivateKey } from "@libp2p/interface";
import { CONFIG_FILE, overrideConfig } from "./config.js";

export async function getPrivateKeyRaw(): Promise<string> {
  const data = await readJson(CONFIG_FILE);
  if (data["privateKey"] === undefined || data["privateKey"] === "")
    throw new Error("Private key not found in config file.");
  return data["privateKey"];
}

export async function getPrivateKey(): Promise<PrivateKey> {
  let data: string;
  try {
    data = await getPrivateKeyRaw();
  } catch (error: any) {
    await generatePrivateKey();
    data = await getPrivateKeyRaw();
  }
  return privateKeyFromRaw(new Uint8Array(Buffer.from(data, "hex")));
}

export async function generatePrivateKey() {
  const privateKey = await generateKeyPair("Ed25519");
  await overrideConfig(
    "privateKey",
    Buffer.from(privateKey.raw).toString("hex")
  );
}
