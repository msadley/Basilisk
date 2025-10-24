import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import type { PrivateKey } from "@libp2p/interface";
import { isBrowser } from "./utils.js";
import { openDB } from "idb";

interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
}

let store: KeyValueStore;

if (isBrowser) {
  const dbPromise = openDB("key-storage", 1, {
    upgrade(db) {
      db.createObjectStore("keys");
    },
  });

  store = {
    async get(key) {
      return (await dbPromise).get("keys", key);
    },
    async put(key, value) {
      await (await dbPromise).put("keys", value, key);
    },
    async clear() {
      await (await dbPromise).clear("keys");
    },
  };
} else {
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  const homeDir = os.homedir();
  const storagePath = path.join(homeDir, ".basilisk", "keys.json");

  async function readStore() {
    try {
      await fs.mkdir(path.dirname(storagePath), { recursive: true });
      const data = await fs.readFile(storagePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async function writeStore(data: any) {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(storagePath, JSON.stringify(data, null, 2));
  }

  store = {
    async get(key) {
      const data = await readStore();
      return data[key];
    },
    async put(key, value) {
      const data = await readStore();
      data[key] = value;
      await writeStore(data);
    },
    async clear() {
      await writeStore({});
    },
  };
}

export async function getAppKey(): Promise<PrivateKey> {
  let seed: Uint8Array | undefined = await store.get("appKeySeed");

  console.log("Retrieved seed from store");
  console.log(seed);

  if (!seed) {
    console.log("Generating new seed...");
    if (isBrowser) {
      seed = crypto.getRandomValues(new Uint8Array(32));
    } else {
      const crypto = await import("crypto");
      seed = crypto.randomBytes(32);
    }
    await store.put("appKeySeed", seed);
    console.log("New seed generated and stored");
  } else {
    console.log("Retrieved seed from store");
  }

  if (
    typeof seed === "object" &&
    seed !== null &&
    !(seed instanceof Uint8Array)
  ) {
    if ((seed as any).type === "Buffer" && Array.isArray((seed as any).data)) {
      seed = new Uint8Array((seed as any).data);
    }
  }

  if (!seed) {
    throw new Error("Failed to retrieve or generate seed");
  }

  return await generateKeyPairFromSeed("Ed25519", seed);
}

export async function clearKeys(): Promise<void> {
  await store.clear();
  console.log("Keys cleared from store");
}
