import type { Stream } from "@libp2p/interface";
import type { Profile } from "../model/Profile.js";
import ProfileRepository from "../repository/ProfileRepository.js";
import { inject, singleton } from "tsyringe";

@singleton()
class ProfileService {
  constructor(
    @inject(ProfileRepository)
    private profileRepository: ProfileRepository,
  ) {}

  async getUserProfile(): Promise<Profile> {
    const userProfile = await this.profileRepository.getById("user");
    if (!userProfile) {
      throw new Error("User profile not found");
    }
    return userProfile;
  }

  async sendUserProfile(stream: Stream) {
    const userProfile = await this.getUserProfile();
    const data: Uint8Array = new TextEncoder().encode(
      JSON.stringify(userProfile),
    );

    if (!stream.send(data))
      await new Promise((resolve) => stream.addEventListener("drain", resolve));

    await stream.close();
  }

  async getById(peerId: string) {
    return this.profileRepository.getById(peerId);
  }

  async update(avatar?: Uint8Array, name?: string) {
    const savedUserProfile = await this.getUserProfile();

    savedUserProfile.avatar = avatar ?? savedUserProfile.avatar;
    savedUserProfile.name = name ?? savedUserProfile.name;

    this.profileRepository.save(savedUserProfile);
  }
}

export default ProfileService;
