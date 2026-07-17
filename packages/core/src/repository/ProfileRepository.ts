import * as schema from "../database/databaseSchema.js";
import { eq } from "drizzle-orm";
import type { Profile } from "../model/Profile.js";
import type { AppDatabase } from "../types.js";
import { singleton, inject, container } from "tsyringe";

@singleton()
class ProfileRepository {
  constructor(
    @inject("AppDatabase", { isOptional: false })
    private database: AppDatabase,
  ) {}

  async getById(id: string): Promise<Profile | undefined> {
    return this.database
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, id))
      .get();
  }

  async save(profile: Profile) {
    const [result] = await this.database.transaction(async (tx) => {
      return await tx
        .insert(schema.profiles)
        .values(profile)
        .onConflictDoUpdate({
          target: schema.profiles.id,
          set: { name: profile.name, avatar: profile.avatar },
        })
        .returning();
    });
    return result;
  }
}

// Save the default profile
container.afterResolution(
  ProfileRepository,
  (_, instance) => {
    (Array.isArray(instance) ? instance[0] : instance).save({
      id: "user",
      name: "",
      avatar: null,
    });
  },
  { frequency: "Once" },
);

export default ProfileRepository;
