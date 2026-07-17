import { messageSchema, type Message } from "../model/Message.js";
import * as schema from "../database/databaseSchema.js";
import { eq } from "drizzle-orm";
import type { MessagePacket } from "../model/MessagePacket.js";
import type { AppDatabase } from "../types.js";
import { singleton, inject } from "tsyringe";

@singleton()
class MessageRepository {
  constructor(
    @inject("AppDatabase")
    private database: AppDatabase,
  ) {}

  async list(chatId: string, limit: number, page: number): Promise<Message[]> {
    const result = await this.database
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.chatId, chatId))
      .limit(limit)
      .offset(page * limit);
    return result.map((row) => {
      return messageSchema.assert(row);
    });
  }

  async save(messagePacket: MessagePacket): Promise<Message> {
    const [row] = await this.database
      .insert(schema.messages)
      .values({
        chatId: messagePacket.chatId,
        senderId: messagePacket.senderId,
        contentType: messagePacket.contentType,
        content: messagePacket.content,
        timestamp: messagePacket.timestamp
          ? new Date(messagePacket.timestamp)
          : new Date(),
      })
      .returning();

    const validationResult = messageSchema.assert(row);
    return validationResult;
  }
}

export default MessageRepository;
