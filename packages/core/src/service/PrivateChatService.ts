import type PrivateChatRepository from "../repository/PrivateChatRepository.js";
import type ProfileService from "../service/ProfileService.js";
import type NodeService from "../service/NodeService.js";
import type { PrivateChat } from "../model/PrivateChat.js";

class PrivateChatService {
  private privateChatRepository: PrivateChatRepository;
  private profileService: ProfileService;
  private nodeService: NodeService;

  constructor(
    privateChatRepository: PrivateChatRepository,
    profileService: ProfileService,
    nodeService: NodeService,
  ) {
    this.privateChatRepository = privateChatRepository;
    this.profileService = profileService;
    this.nodeService = nodeService;
  }

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
      this.nodeService.addKnownPeer(peerId);
      return this.privateChatRepository.save({
        id: peerId,
        participants: [peerId, (await this.profileService.getUserProfile()).id],
      });
    }
  }
}

export default PrivateChatService;
