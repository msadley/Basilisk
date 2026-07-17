import type { GroupChat } from "../model/GroupChat.js";
import GroupChatRepository from "../repository/GroupChatRepository.js";
import { inject, singleton } from "tsyringe";

@singleton()
class GroupChatService {
  constructor(
    @inject(GroupChatRepository)
    private groupChatRepository: GroupChatRepository,
  ) {}

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
