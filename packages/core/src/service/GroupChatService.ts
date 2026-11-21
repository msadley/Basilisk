import type { GroupChat } from "../model/GroupChat.js";
import { GroupChatRepository } from "../repository/GroupChatRepository.js";
import { ProfileService } from "./ProfileService.js";

export class GroupChatService {
  constructor(
    private groupChatRepository: GroupChatRepository,
    private profileService: ProfileService,
  ) {}

  async getById(id: string): Promise<GroupChat | undefined> {
    return this.groupChatRepository.getById(id);
  }

  async list(): Promise<GroupChat[]> {
    return this.groupChatRepository.list();
  }

  async create(
    name: string,
    participants: string[],
    image: Uint8Array | null,
  ): Promise<GroupChat | undefined> {
    // TODO: add libp2p pubsub logic
    const uniqueParticipants = Array.from(new Set(participants));
    await Promise.all(
      uniqueParticipants.map((peerId) =>
        this.profileService.ensureProfile(peerId),
      ),
    );

    return this.groupChatRepository.save({
      id: crypto.randomUUID().toString(),
      name,
      participants: uniqueParticipants,
      image,
    });
  }
}
