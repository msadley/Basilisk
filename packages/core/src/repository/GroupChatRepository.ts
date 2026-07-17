import { and, eq } from "drizzle-orm";
import * as schema from "../database/databaseSchema.js";
import type { GroupChat } from "../model/GroupChat.js";
import { type AppDatabase } from "../types.js";
import { singleton, inject } from "tsyringe";

@singleton()
class GroupChatRepository {
  constructor(
    @inject("AppDatabase", { isOptional: false })
    private database: AppDatabase,
  ) {}

  async getById(id: string): Promise<GroupChat | undefined> {
    const result = await this.database.query.chats.findFirst({
      where: and(eq(schema.chats.id, id), eq(schema.chats.isGroup, true)),
      with: {
        chatParticipants: {
          columns: {
            userId: true,
          },
        },
      },
    });
    if (result === undefined) return undefined;
    if (!result.name) {
      throw new Error(`Group chat with ID ${result.id} is missing a name.`);
    }
    return {
      id: result.id,
      image: result.image,
      name: result.name,
      participants: result.chatParticipants.map((e) => e.userId),
    };
  }

  async list(): Promise<GroupChat[]> {
    const result = await this.database.query.chats.findMany({
      with: {
        chatParticipants: {
          columns: {
            userId: true,
          },
        },
      },
    });

    return result.map((chat) => {
      if (!chat.name) {
        throw new Error(`Group chat with ID ${chat.id} is missing a name.`);
      }
      return {
        id: chat.id,
        image: chat.image,
        name: chat.name,
        participants: chat.chatParticipants.map((e) => e.userId),
      };
    });
  }

  async save(chat: GroupChat): Promise<GroupChat> {
    return this.database.transaction(async (transaction) => {
      const [savedChat] = await transaction
        .insert(schema.chats)
        .values({
          id: chat.id,
          isGroup: true,
          image: chat.image,
          name: chat.name,
        })
        .returning();

      const newParticipants = chat.participants.map((peerId) => ({
        chatId: chat.id,
        userId: peerId,
      }));

      const savedParticipants = await transaction
        .insert(schema.chatParticipants)
        .values(newParticipants)
        .returning();

      if (!savedChat.name) {
        throw new Error(
          `Group chat with ID ${savedChat.id} is missing a name.`,
        );
      }

      return {
        ...savedChat,
        name: savedChat.name,
        participants: savedParticipants.map((e) => e.userId),
      };
    });
  }
}

export default GroupChatRepository;
