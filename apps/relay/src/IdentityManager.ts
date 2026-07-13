import type { DatabaseAdapter } from "./DatabaseAdapter.js";
import { identity } from "./DatabaseSchema.js";
import { eq } from "drizzle-orm";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import type { PrivateKey } from "@libp2p/interface";

class IdentityManager {
  private databaseAdapter: DatabaseAdapter;

  constructor(databaseAdapter: DatabaseAdapter) {
    this.databaseAdapter = databaseAdapter;
  }

  private async getSeed(): Promise<Uint8Array | undefined> {
    return this.databaseAdapter
      .select()
      .from(identity)
      .where(eq(identity.id, 0))
      .then((result) => result[0]?.seed);
  }

  private async generateSeed(): Promise<Uint8Array> {
    const seed = crypto.getRandomValues(new Uint8Array(32));
    await this.databaseAdapter.insert(identity).values({ id: 0, seed });
    return seed;
  }

  async getIdentity(): Promise<PrivateKey> {
    let seed = await this.getSeed();
    if (seed === undefined) seed = await this.generateSeed();
    return generateKeyPairFromSeed("Ed25519", seed);
  }
}

export default IdentityManager;
