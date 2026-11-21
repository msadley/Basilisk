import type { Stream, Connection } from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";
import { groupChatSchema } from "../model/GroupChat.js";
import { MessagePacket, messagePacketSchema } from "../model/MessagePacket.js";
import { MessageRepository } from "../repository/MessageRepository.js";
import { ChatService } from "./ChatService.js";
import { NodeService } from "./NodeService.js";
import { ProfileService } from "./ProfileService.js";
import { Message } from "../model/Message.js";

export class MessageService {
  constructor(
    private messageRepository: MessageRepository,
    private chatService: ChatService,
    private profileService: ProfileService,
    private nodeService: NodeService,
  ) {}

  async list(chatId: string, cursor?: number) {
    return await this.messageRepository.list(chatId, cursor);
  }

  async handleMessageReceived(stream: Stream, connection: Connection) {
    const raw: unknown = await new Promise((resolve) => {
      stream.addEventListener("message", (evt) => {
        resolve(JSON.parse(new TextDecoder().decode(evt.data.subarray())));
      });
    });
    await stream.close();

    const normalized =
      raw &&
      typeof raw === "object" &&
      "timestamp" in raw &&
      (typeof raw.timestamp === "string" || typeof raw.timestamp === "number")
        ? { ...raw, timestamp: new Date(raw.timestamp) }
        : raw;

    const messagePacket = messagePacketSchema.assert(normalized);

    // TODO: verify if this is enough to ensure the sender is who they claim to be
    if (connection.remotePeer.toString() !== messagePacket.senderId)
      throw new Error("Sender ID does not match remote peer ID");

    // Group chats are not implemented yet; private chats are keyed by the remote sender's peer ID.
    const localChatId = messagePacket.senderId;
    const localPacket: MessagePacket = {
      ...messagePacket,
      chatId: localChatId,
    };

    if ((await this.chatService.getById(localChatId)) === undefined) {
      await this.chatService.createPrivateChat(localChatId);
    } else {
      await this.profileService.ensureProfile(localPacket.senderId);
    }

    return await this.messageRepository.save(localPacket, true);
  }

  async send(chatId: string, content: string): Promise<Message> {
    const chat = await this.chatService.getById(chatId);

    if (chat === undefined) throw new Error("Chat not found");

    if (groupChatSchema.allows(chat)) {
      // TODO: Implement messaging chat groups
      throw new Error("Group chat message sending not yet implemented");
    }

    const userProfile = await this.profileService.getUserProfile();
    const recipient = chat.participants.find((p) => p !== userProfile.id);

    if (!recipient) {
      throw new Error(`No recipient found for chat ${chatId}`);
    }

    const messagePacket: MessagePacket = {
      senderId: userProfile.id,
      chatId,
      timestamp: new Date(),
      contentType: "text",
      content,
    };

    await this.nodeService.sendMessage(
      peerIdFromString(recipient),
      messagePacket,
    );

    return this.messageRepository.save(messagePacket);
  }
}
