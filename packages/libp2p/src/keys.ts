import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import type { PrivateKey } from "@libp2p/interface";

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
}

export async function getPrivateKey(store: KeyValueStore): Promise<PrivateKey> {
  let seed = await store.get<Uint8Array>("appKeySeed");

  if (!seed) {
    seed = crypto.getRandomValues(new Uint8Array(32));
    await store.put("appKeySeed", seed);
  }

  return generateKeyPairFromSeed("Ed25519", seed);
}
