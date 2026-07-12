import { eq } from "drizzle-orm";
import { profiles } from "../database/databaseSchema.js";
import type { Profile } from "../model/Profile.js";
import type { AppDatabase } from "../types.js";

class ProfileRepository {
  private database: AppDatabase;

  constructor(database: AppDatabase) {
    this.database = database;
  }

  async getById(id: string): Promise<Profile | undefined> {
    return this.database
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .get();
  }

  async save(profile: Profile) {
    const [result] = await this.database.transaction(async (tx) => {
      return await tx
        .insert(profiles)
        .values(profile)
        .onConflictDoUpdate({
          target: profiles.id,
          set: { name: profile.name, avatar: profile.avatar },
        })
        .returning();
    });
    return result;
  }
}

export default ProfileRepository;
