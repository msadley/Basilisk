import { messageSchema, type Message } from "../model/Message.js";
import * as schema from "../database/databaseSchema.js";
import { and, eq, lt, desc } from "drizzle-orm";
import type { MessagePacket } from "../model/MessagePacket.js";
import type { AppDatabase } from "../types.js";

export class MessageRepository {
  constructor(private database: AppDatabase) {}

  async list(
    chatId: string,
    cursor?: number,
    limit: number = 30,
  ): Promise<Message[]> {
    const result = await this.database
      .select()
      .from(schema.messages)
      .where(
        cursor !== undefined
          ? and(
              eq(schema.messages.chatId, chatId),
              lt(schema.messages.id, cursor),
            )
          : eq(schema.messages.chatId, chatId),
      )
      .orderBy(desc(schema.messages.id))
      .limit(limit + 1);
    return result.map((row) => {
      return messageSchema.assert(row);
    });
  }

  async save(
    messagePacket: MessagePacket,
    received: boolean = false,
  ): Promise<Message> {
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
        received,
      })
      .returning();

    const validationResult = messageSchema.assert(row);
    return validationResult;
  }
}
