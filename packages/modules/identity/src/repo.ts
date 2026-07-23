import { eq } from "drizzle-orm";
import { schema, type DbCore } from "@mia/db-core";
import type { Profile, UpdateProfile } from "@mia/contracts";

/** The only file in this module touching @mia/db-core. */

export class IdentityRepo {
  constructor(private db: DbCore) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const row = await this.db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId))
      .get();
    if (!row) return null;
    return {
      firstName: row.firstName,
      lastName: row.lastName,
      avatarUrl: row.avatarUrl,
    };
  }

  async upsertProfile(userId: string, input: UpdateProfile): Promise<Profile> {
    const now = new Date();
    await this.db
      .insert(schema.profiles)
      .values({ id: userId, ...input, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: { ...input, updatedAt: now },
      });
    return (await this.getProfile(userId))!;
  }
}
