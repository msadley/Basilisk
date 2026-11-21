import { messageSchema, type Message } from "../model/Message.js";
import * as schema from "../database/databaseSchema.js";
import { and, eq, lt, desc } from "drizzle-orm";
import type { MessagePacket } from "../model/MessagePacket.js";
import type { AppDatabase } from "../types.js";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function decodeMessageRow(row: typeof schema.messages.$inferSelect): Message {
  const normalized =
    row.contentType === "text"
      ? { ...row, content: textDecoder.decode(row.content) }
      : row;
  return messageSchema.assert(normalized);
}

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
    return result.map(decodeMessageRow);
  }

  async save(
    messagePacket: MessagePacket,
    received: boolean = false,
  ): Promise<Message> {
    const content =
      messagePacket.contentType === "text"
        ? textEncoder.encode(messagePacket.content)
        : messagePacket.content;

    const [row] = await this.database
      .insert(schema.messages)
      .values({
        chatId: messagePacket.chatId,
        senderId: messagePacket.senderId,
        contentType: messagePacket.contentType,
        content,
        timestamp: messagePacket.timestamp
          ? new Date(messagePacket.timestamp)
          : new Date(),
        received,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to save message");
    }

    return decodeMessageRow(row);
  }
}
