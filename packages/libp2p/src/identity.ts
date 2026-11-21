import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import type { PrivateKey } from "@libp2p/interface";

export const IDENTITY_SEED_LENGTH = 32;

export function generateIdentitySeed(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IDENTITY_SEED_LENGTH));
}

export async function createIdentityFromSeed(
  seed: Uint8Array,
): Promise<PrivateKey> {
  return generateKeyPairFromSeed("Ed25519", seed);
}
