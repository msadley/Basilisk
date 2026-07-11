import MessageRepository from "../repository/MessageRepository.js";
import type NodeService from "./NodeService.js";
import type ProfileService from "./ProfileService.js";
import type ChatService from "./ChatService.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { groupChatSchema } from "../model/GroupChat.js";
import { privateChatSchema } from "../model/PrivateChat.js";
import type { MessagePacket } from "../model/MessagePacket.js";

class MessageService {
  private messageRepository: MessageRepository;
  private profileService: ProfileService;
  private nodeService: NodeService;
  private chatService: ChatService;

  constructor(
    messageRepository: MessageRepository,
    chatService: ChatService,
    profileService: ProfileService,
    nodeService: NodeService,
  ) {
    this.messageRepository = messageRepository;
    this.chatService = chatService;
    this.profileService = profileService;
    this.nodeService = nodeService;
  }

  async list(chatId: string, limit: number, page: number) {
    return await this.messageRepository.list(chatId, limit, page);
  }

  async handleMessageReceived(message: MessagePacket) {
    return await this.messageRepository.save(message);
  }

  async send(chatId: string, content: string) {
    try {
      const chat = await this.chatService.getById(chatId);

      if (typeof chat !== "undefined" && chat instanceof groupChatSchema)
        // TODO: Implement messaging chat groups
        throw new Error("Group chat message sending not yet implemented");

      if (typeof chat !== "undefined" && chat instanceof privateChatSchema) {
        // TODO: improve peerId acquistion logic
        const recipient = chat.participants.filter(async (p) => {
          const userProfile = await this.profileService.getUserProfile();
          return p === userProfile.id;
        })[0];

        await this.nodeService.sendMessageToPeerId(
          peerIdFromString(recipient),
          content,
        );
      }
    } catch {
      throw new Error(`Chat not found or not supported`);
    }
  }
}

export default MessageService;
