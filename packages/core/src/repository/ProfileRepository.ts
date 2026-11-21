import * as schema from "../database/databaseSchema.js";
import { eq } from "drizzle-orm";
import type { Profile } from "../model/Profile.js";
import type { AppDatabase } from "../types.js";

export class ProfileRepository {
  constructor(private database: AppDatabase) {}

  async getById(id: string): Promise<Profile | undefined> {
    return this.database
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, id))
      .get();
  }

  async list(): Promise<Profile[]> {
    return this.database.select().from(schema.profiles);
  }

  async createIfNotExists(profile: Profile): Promise<void> {
    await this.database
      .insert(schema.profiles)
      .values(profile)
      .onConflictDoNothing({ target: schema.profiles.id });
  }

  async save(profile: Profile): Promise<Profile> {
    const [result] = await this.database
      .insert(schema.profiles)
      .values(profile)
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: { name: profile.name, avatar: profile.avatar },
      })
      .returning();
    return result;
  }
}
