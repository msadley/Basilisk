import * as schema from "../database/databaseSchema.js";
import { eq, and } from "drizzle-orm";
import { type PrivateChat } from "../model/PrivateChat.js";
import type { AppDatabase } from "../types.js";

export class PrivateChatRepository {
  constructor(private database: AppDatabase) {}

  async getById(id: string): Promise<PrivateChat | undefined> {
    const result = await this.database.query.chats.findFirst({
      where: and(eq(schema.chats.id, id), eq(schema.chats.isGroup, false)),
      with: {
        chatParticipants: {
          columns: {
            userId: true,
          },
        },
      },
    });
    if (result === undefined) return undefined;
    return {
      id: result.id,
      participants: result.chatParticipants.map(
        (participant) => participant.userId,
      ),
    };
  }

  async list(): Promise<PrivateChat[]> {
    const results = await this.database.query.chats.findMany({
      where: eq(schema.chats.isGroup, false),
      with: {
        chatParticipants: {
          columns: {
            userId: true,
          },
        },
      },
    });
    return results.map((result) => ({
      id: result.id,
      participants: result.chatParticipants.map(
        (participant) => participant.userId,
      ),
    }));
  }

  async save(chat: PrivateChat): Promise<PrivateChat> {
    const newParticipants = Array.from(new Set(chat.participants)).map(
      (peerId) => ({
        chatId: chat.id,
        userId: peerId,
      }),
    );

    const insertChatQuery = this.database
      .insert(schema.chats)
      .values({ id: chat.id, isGroup: false })
      .returning();

    if (newParticipants.length === 0) {
      const [[savedChat]] = await this.database.batch([insertChatQuery]);
      return {
        id: savedChat.id,
        participants: [],
      };
    }

    const [[savedChat], savedParticipants] = await this.database.batch([
      insertChatQuery,
      this.database
        .insert(schema.chatParticipants)
        .values(newParticipants)
        .returning(),
    ]);

    return {
      id: savedChat.id,
      participants: savedParticipants.map((p) => p.userId),
    };
  }
}
