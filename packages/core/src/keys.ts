import { openDB } from "idb";
import { generateKeyPairFromSeed } from '@libp2p/crypto/keys';
import type { PrivateKey } from '@libp2p/interface';

const idbPromise = openDB("key-storage", 1, {
  upgrade(db: { createObjectStore: (arg0: string) => void; }) {
    db.createObjectStore("keys");
  },
});

export async function getAppKeyPair(): Promise<PrivateKey> {
  const db = await idbPromise;
  let seed = await db.get("keys", "appKeySeed");

  if (!seed) {
    console.log("Generating new seed...");
    seed = crypto.getRandomValues(new Uint8Array(32));
    await db.put("keys", seed, "appKeySeed");
    console.log("New seed generated and stored");
  } else {
    console.log("Retrieved seed from IndexedDB");
  }

  return await generateKeyPairFromSeed('Ed25519', seed);
}

export async function clearKeys(): Promise<void> {
  const db = await idbPromise;
  await db.clear("keys");
  console.log("Keys cleared from IndexedDB");
}
