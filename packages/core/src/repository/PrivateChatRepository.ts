import type { AppDatabase } from "../database/databaseAdapter.js";
import { chatParticipants, chats } from "../database/databaseSchema.js";
import { eq, and } from "drizzle-orm";
import { type PrivateChat } from "../model/PrivateChat.js";

class PrivateChatRepository {
  private database: AppDatabase;
  constructor(database: AppDatabase) {
    this.database = database;
  }

  async getById(id: string): Promise<PrivateChat | undefined> {
    const result = await this.database.query.chats.findFirst({
      where: and(eq(chats.id, id), eq(chats.isGroup, false)),
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
      where: eq(chats.isGroup, false),
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
    return this.database.transaction(async (tx) => {
      const [savedChat] = await tx
        .insert(chats)
        .values({ id: chat.id, isGroup: false })
        .returning();

      const newParticipants = chat.participants.map((peerId) => ({
        chatId: chat.id,
        userId: peerId,
      }));

      const savedParticipants = await tx
        .insert(chatParticipants)
        .values(newParticipants)
        .returning();

      return {
        ...savedChat,
        participants: savedParticipants.map((p) => p.userId),
      };
    });
  }
}

export default PrivateChatRepository;
