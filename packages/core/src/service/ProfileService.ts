import type { Stream } from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";
import type { Profile } from "../model/Profile.js";
import { ProfileRepository } from "../repository/ProfileRepository.js";
import { NodeService } from "./NodeService.js";

export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private nodeService: NodeService,
    private userId: string,
  ) {}

  async getUserProfile(): Promise<Profile> {
    const userProfile = await this.profileRepository.getById(this.userId);
    if (!userProfile) {
      throw new Error("User profile not found");
    }
    return userProfile;
  }

  async list() {
    return this.profileRepository.list();
  }

  async sendUserProfile(stream: Stream) {
    const userProfile = await this.getUserProfile();
    const payload = {
      ...userProfile,
      avatar: userProfile.avatar ? Array.from(userProfile.avatar) : null,
    };
    const data: Uint8Array = new TextEncoder().encode(JSON.stringify(payload));

    if (!stream.send(data))
      await new Promise((resolve) => stream.addEventListener("drain", resolve));

    await stream.close();
  }

  async getById(peerId: string) {
    return this.profileRepository.getById(peerId);
  }

  async ensureProfile(peerId: string): Promise<void> {
    await this.profileRepository.createIfNotExists({
      id: peerId,
      name: null,
      avatar: null,
    });
  }

  async fetchPeerProfile(peerId: string): Promise<Profile> {
    const remoteProfile = await this.nodeService.getPeerProfile(
      peerIdFromString(peerId),
    );
    return this.profileRepository.save(remoteProfile);
  }

  async update(avatar?: Uint8Array, name?: string) {
    const savedUserProfile = await this.getUserProfile();

    savedUserProfile.avatar = avatar ?? savedUserProfile.avatar;
    savedUserProfile.name = name ?? savedUserProfile.name;

    await this.profileRepository.save(savedUserProfile);
  }
}
