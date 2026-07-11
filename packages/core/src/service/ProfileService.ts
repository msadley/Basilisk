import type { Stream } from "@libp2p/interface";
import type { Profile } from "../model/Profile.js";
import type ProfileRepository from "../repository/ProfileRepository.js";
import { sendDataToStream } from "../utils.js";

class ProfileService {
  private profileRepository: ProfileRepository;

  constructor(profileRepository: ProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async getUserProfile(): Promise<Profile> {
    const userProfile = await this.profileRepository.getById("user");
    if (!userProfile) {
      throw new Error("User profile not found");
    }
    return userProfile;
  }

  sendUserProfile(stream: Stream) {
    sendDataToStream(stream, this.getUserProfile());
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
