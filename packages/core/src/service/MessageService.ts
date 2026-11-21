import type { Stream, Connection } from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";
import { groupChatSchema } from "../model/GroupChat.js";
import { MessagePacket, messagePacketSchema } from "../model/MessagePacket.js";
import { base64ToUint8Array, readStreamJson } from "../node/stream.js";
import { MessageRepository } from "../repository/MessageRepository.js";
import { ChatService } from "./ChatService.js";
import { NodeService } from "./NodeService.js";
import { ProfileService } from "./ProfileService.js";
import { Message } from "../model/Message.js";

export class MessageService {
  private pendingChatCreations = new Map<string, Promise<void>>();

  constructor(
    private messageRepository: MessageRepository,
    private chatService: ChatService,
    private profileService: ProfileService,
    private nodeService: NodeService,
  ) {}

  async list(chatId: string, cursor?: number) {
    return await this.messageRepository.list(chatId, cursor);
  }

  private async ensurePrivateChat(
    localChatId: string,
    senderId: string,
  ): Promise<void> {
    const pending = this.pendingChatCreations.get(localChatId);
    if (pending) {
      await pending;
      return;
    }

    const ensurePromise = (async () => {
      if ((await this.chatService.getById(localChatId)) === undefined) {
        try {
          await this.chatService.createPrivateChat(localChatId);
        } catch (error) {
          if ((await this.chatService.getById(localChatId)) === undefined) {
            throw error;
          }
          await this.profileService.ensureProfile(senderId);
        }
      } else {
        await this.profileService.ensureProfile(senderId);
      }
    })();

    this.pendingChatCreations.set(localChatId, ensurePromise);
    try {
      await ensurePromise;
    } finally {
      if (this.pendingChatCreations.get(localChatId) === ensurePromise) {
        this.pendingChatCreations.delete(localChatId);
      }
    }
  }

  async handleMessageReceived(stream: Stream, connection: Connection) {
    const raw = await readStreamJson(stream);

    let normalized: unknown = raw;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const record = raw as Record<string, unknown>;
      const updates: Record<string, unknown> = {};

      if (
        typeof record.timestamp === "string" ||
        typeof record.timestamp === "number"
      ) {
        updates.timestamp = new Date(record.timestamp);
      }

      if (
        (record.contentType === "image" || record.contentType === "file") &&
        typeof record.content === "string"
      ) {
        updates.content = base64ToUint8Array(record.content);
      }

      if (Object.keys(updates).length > 0) {
        normalized = { ...record, ...updates };
      }
    }

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

    await this.ensurePrivateChat(localChatId, localPacket.senderId);

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
