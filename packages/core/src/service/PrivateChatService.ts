import { PrivateChatRepository } from "../repository/PrivateChatRepository.js";
import { ProfileService } from "../service/ProfileService.js";
import { type PrivateChat } from "../model/PrivateChat.js";
import { PrivateChatCache } from "../repository/PrivateChatCache.js";

export class PrivateChatService {
  constructor(
    private privateChatRepository: PrivateChatRepository,
    private profileService: ProfileService,
    private privateChatCache: PrivateChatCache,
  ) {}

  async getById(id: string): Promise<PrivateChat | undefined> {
    return this.privateChatRepository.getById(id);
  }

  async list(): Promise<PrivateChat[]> {
    return this.privateChatRepository.list();
  }

  async create(peerId: string): Promise<PrivateChat> {
    const userProfile = await this.profileService.getUserProfile();
    if (peerId === userProfile.id) {
      throw new Error("Cannot create a private chat with yourself");
    }

    const existingChat = await this.privateChatRepository.getById(peerId);
    if (existingChat) {
      throw new Error("Chat already exists");
    }

    await this.profileService.ensureProfile(peerId);

    const savedChat = await this.privateChatRepository.save({
      id: peerId,
      participants: [peerId, userProfile.id],
    });
    this.privateChatCache.add(peerId);
    return savedChat;
  }
}
