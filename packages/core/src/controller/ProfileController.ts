import type ProfileService from "../service/ProfileService.js";
import type { UIPayload } from "../types.js";

class ProfileController {
  private profileService: ProfileService;

  constructor(profileService: ProfileService) {
    this.profileService = profileService;
  }

  async getById(payload: UIPayload<"get-profile">) {
    return this.profileService.getById(payload.peerId);
  }

  async getUserProfile() {
    return this.profileService.getUserProfile();
  }

  update(payload: UIPayload<"update-profile">) {
    this.profileService.update(payload.avatar, payload.name);
  }
}

export default ProfileController;
