import { identity } from "../database/databaseSchema.js";
import type { AppDatabase } from "../types.js";

class IdentityRepository {
  private database: AppDatabase;

  constructor(database: AppDatabase) {
    this.database = database;
  }

  async getSeed(): Promise<Uint8Array | undefined> {
    const result = await this.database.query.identity.findFirst();
    return result === undefined ? undefined : result.seed;
  }

  async generateSeed(): Promise<Uint8Array> {
    const seed = crypto.getRandomValues(new Uint8Array(32));
    await this.database.insert(identity).values({ id: 0, seed });
    return seed;
  }
}

export default IdentityRepository;
