import type { Profile, UpdateProfile } from "@mia/contracts";
import type { IdentityRepo } from "./repo";

const EMPTY_PROFILE: Profile = {
  firstName: null,
  lastName: null,
  avatarUrl: null,
};

export class IdentityService {
  constructor(private repo: IdentityRepo) {}

  async getProfile(userId: string): Promise<Profile> {
    return (await this.repo.getProfile(userId)) ?? EMPTY_PROFILE;
  }

  updateProfile(userId: string, input: UpdateProfile): Promise<Profile> {
    return this.repo.upsertProfile(userId, input);
  }
}
