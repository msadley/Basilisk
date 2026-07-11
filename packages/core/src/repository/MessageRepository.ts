import { messageSchema, type Message } from "../model/Message.js";
import type { AppDatabase } from "../database/databaseAdapter.js";
import { messages } from "../database/databaseSchema.js";
import { eq } from "drizzle-orm";
import type { MessagePacket } from "../model/MessagePacket.js";

class MessageRepository {
  private database: AppDatabase;

  constructor(database: AppDatabase) {
    this.database = database;
  }

  async list(chatId: string, limit: number, page: number): Promise<Message[]> {
    const result = await this.database
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .limit(limit)
      .offset(page * limit);
    return result.map((row) => {
      return messageSchema.assert(row);
    });
  }

  async save(messagePacket: MessagePacket): Promise<Message> {
    const [row] = await this.database
      .insert(messages)
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
