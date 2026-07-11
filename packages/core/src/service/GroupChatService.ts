import type { GroupChat } from "../model/GroupChat.js";
import type GroupChatRepository from "../repository/GroupChatRepository.js";

class GroupChatService {
  private groupChatRepository: GroupChatRepository;

  constructor(groupChatRepository: GroupChatRepository) {
    this.groupChatRepository = groupChatRepository;
  }

  async getById(id: string): Promise<GroupChat | undefined> {
    return this.groupChatRepository.getById(id);
  }

  async list(): Promise<GroupChat[]> {
    return this.groupChatRepository.list();
  }

  async createGroupChat(
    name: string,
    participants: string[],
    image: Uint8Array | null,
  ): Promise<GroupChat | undefined> {
    // TODO: add libp2p pubsub logic
    return this.groupChatRepository.save({
      id: crypto.randomUUID().toString(),
      name,
      participants,
      image,
    });
  }
}
export default GroupChatService;
