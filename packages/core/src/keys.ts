// packages/core/src/keys.ts

import { openDB } from "idb";

const idbPromise = openDB("key-storage", 1, {
  upgrade(db: { createObjectStore: (arg0: string) => void }) {
    db.createObjectStore("keys");
  },
});

export async function getAppKeyPair(): Promise<CryptoKeyPair> {
  const db = await idbPromise;
  let keyPair: CryptoKeyPair | undefined = await db.get("keys", "appKeyPair");

  if (keyPair) {
    console.log("Retrieved key from IndexedDB");
    return keyPair;
  }

  console.log("Generating new key...");
  keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign", "verify"]
  );

  await db.put("keys", keyPair, "appKeyPair");
  console.log("New key generated and stored");
  return keyPair;
}
