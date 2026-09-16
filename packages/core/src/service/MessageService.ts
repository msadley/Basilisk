import type { Stream, Connection } from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";
import { groupChatSchema } from "../model/GroupChat.js";
import { messagePacketSchema } from "../model/MessagePacket.js";
import { privateChatSchema } from "../model/PrivateChat.js";
import { MessageRepository } from "../repository/MessageRepository.js";
import { ChatService } from "./ChatService.js";
import { NodeService } from "./NodeService.js";
import { ProfileService } from "./ProfileService.js";

export class MessageService {
  constructor(
    private messageRepository: MessageRepository,
    private chatService: ChatService,
    private profileService: ProfileService,
    private nodeService: NodeService,
  ) {}

  async list(chatId: string, limit: number, page: number) {
    return await this.messageRepository.list(chatId, limit, page);
  }

  async handleMessageReceived(stream: Stream, connection: Connection) {
    const data = await new Promise((resolve) => {
      stream.addEventListener("message", (evt) => {
        resolve(JSON.parse(new TextDecoder().decode(evt.data.subarray())));
      });
    });
    await stream.close();

    const messagePacket = messagePacketSchema.assert(data);

    // TODO: verify if this is enough to ensure the sender is who they claim to be
    if (connection.remotePeer.toString() !== messagePacket.senderId)
      throw new Error("Sender ID does not match remote peer ID");

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
