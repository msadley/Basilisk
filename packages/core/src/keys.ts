// packages/core/src/keys.ts

import { generateKeyPair, privateKeyFromRaw } from "@libp2p/crypto/keys";
import type { PrivateKey } from "@libp2p/interface";
import { getConfigField, overrideConfigField } from "./config.js";

export async function getRawPrivateKey(): Promise<string> {
  const rawPrivateKey = await getConfigField("privateKey");
  if (rawPrivateKey === undefined || rawPrivateKey === "")
    throw new Error("Private key not found in config file.");
  return rawPrivateKey;
}

export async function getPrivateKey(): Promise<PrivateKey> {
  let data: string;
  try {
    data = await getRawPrivateKey();
  } catch (error: any) {
    await generatePrivateKey();
    data = await getRawPrivateKey();
  }
  return privateKeyFromRaw(new Uint8Array(Buffer.from(data, "hex")));
}

export async function generatePrivateKey() {
  const privateKey = await generateKeyPair("Ed25519");
  await overrideConfigField(
    "privateKey",
    Buffer.from(privateKey.raw).toString("hex")
  );
}
