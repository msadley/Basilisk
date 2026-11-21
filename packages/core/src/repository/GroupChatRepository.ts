import { and, eq } from "drizzle-orm";
import * as schema from "../database/databaseSchema.js";
import type { GroupChat } from "../model/GroupChat.js";
import { type AppDatabase } from "../types.js";

export class GroupChatRepository {
  constructor(private database: AppDatabase) {}

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
      where: eq(schema.chats.isGroup, true),
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
    if (!chat.name) {
      throw new Error(`Group chat with ID ${chat.id} is missing a name.`);
    }

    const newParticipants = Array.from(new Set(chat.participants)).map(
      (peerId) => ({
        chatId: chat.id,
        userId: peerId,
      }),
    );

    const insertChatQuery = this.database
      .insert(schema.chats)
      .values({
        id: chat.id,
        isGroup: true,
        image: chat.image,
        name: chat.name,
      })
      .returning();

    let savedChat: typeof schema.chats.$inferSelect;
    let savedParticipants: (typeof schema.chatParticipants.$inferSelect)[];

    if (newParticipants.length === 0) {
      const [[chatRow]] = await this.database.batch([insertChatQuery]);
      savedChat = chatRow;
      savedParticipants = [];
    } else {
      const [[chatRow], participantRows] = await this.database.batch([
        insertChatQuery,
        this.database
          .insert(schema.chatParticipants)
          .values(newParticipants)
          .returning(),
      ]);
      savedChat = chatRow;
      savedParticipants = participantRows;
    }

    if (!savedChat.name) {
      throw new Error(`Group chat with ID ${savedChat.id} is missing a name.`);
    }

    return {
      id: savedChat.id,
      name: savedChat.name,
      image: savedChat.image,
      participants: savedParticipants.map((p) => p.userId),
    };
  }
}
