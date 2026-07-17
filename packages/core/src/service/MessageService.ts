import type { Stream } from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";
import { groupChatSchema } from "../model/GroupChat.js";
import { messagePacketSchema } from "../model/MessagePacket.js";
import { privateChatSchema } from "../model/PrivateChat.js";
import MessageRepository from "../repository/MessageRepository.js";
import ChatService from "./ChatService.js";
import NodeService from "./NodeService.js";
import ProfileService from "./ProfileService.js";
import { inject, singleton } from "tsyringe";

@singleton()
class MessageService {
  constructor(
    @inject(MessageRepository)
    private messageRepository: MessageRepository,
    @inject(ChatService)
    private chatService: ChatService,
    @inject(ProfileService)
    private profileService: ProfileService,
    @inject(NodeService)
    private nodeService: NodeService,
  ) {}

  async list(chatId: string, limit: number, page: number) {
    return await this.messageRepository.list(chatId, limit, page);
  }

  async handleMessageReceived(stream: Stream) {
    const data = await new Promise((resolve) => {
      stream.addEventListener("message", (evt) => {
        resolve(JSON.parse(new TextDecoder().decode(evt.data.subarray())));
      });
    });
    await stream.close();

    const messagePacket = messagePacketSchema.assert(data);
    return await this.messageRepository.save(messagePacket);
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

        await this.nodeService.sendMessage(
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
