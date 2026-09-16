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

  async createPrivateChat(peerId: string): Promise<PrivateChat> {
    try {
      this.privateChatRepository.getById(peerId);
      throw new Error("Chat already exists");
    } catch {
      this.privateChatCache.add(peerId);
      return this.privateChatRepository.save({
        id: peerId,
        participants: [peerId, (await this.profileService.getUserProfile()).id],
      });
    }
  }
}
