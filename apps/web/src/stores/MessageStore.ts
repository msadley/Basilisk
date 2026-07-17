import { create } from "zustand";
import { workerController } from "../worker/workerController";
import { useUserStore } from "./UserStore";
import { v7 as uuidv7 } from "uuid";
import type { Message as CoreMessage } from "@basilisk/core";

export type Message = {
  uuid: string;
  content: string;
  from: string;
  chatId: string;
  status: "sending" | "error" | "ok";
};

export interface ChatState {
  messages: Record<string, Message>;
  ids: string[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
}

const defaultChatState = (): ChatState => ({
  messages: {},
  ids: [],
  page: 0,
  hasMore: true,
  isLoading: false,
});

// Helper to map CoreMessage to Frontend Message
const mapCoreToFrontendMessage = (msg: CoreMessage): Message => {
  return {
    uuid: String(msg.id),
    content: typeof msg.content === "string" ? msg.content : "",
    from: msg.senderId,
    chatId: msg.chatId,
    status: "ok",
  };
};

interface MessageStoreState {
  chats: Record<string, ChatState>;
  handleMessageReceived: (message: CoreMessage) => Promise<void>;
  loadMore: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  resendMessage: (chatId: string, messageId: string) => Promise<void>;
}

export const useMessageStore = create<MessageStoreState>((set, get) => {
  const ensureChatState = (chats: Record<string, ChatState>, chatId: string): ChatState => {
    return chats[chatId] || defaultChatState();
  };

  return {
    chats: {},

    handleMessageReceived: async (message) => {
      const mapped = mapCoreToFrontendMessage(message);
      const chatId = mapped.chatId.includes("group-")
        ? mapped.chatId
        : mapped.from;

      set((state) => {
        const chats = { ...state.chats };
        const chat = { ...ensureChatState(chats, chatId) };

        if (!chat.messages[mapped.uuid]) {
          chat.messages = {
            ...chat.messages,
            [mapped.uuid]: mapped,
          };
          chat.ids = [...chat.ids, mapped.uuid];
          chats[chatId] = chat;
        }

        return { chats };
      });
    },

    loadMore: async (chatId) => {
      const currentChat = ensureChatState(get().chats, chatId);
      if (!currentChat.hasMore || currentChat.isLoading) {
        return;
      }

      set((state) => {
        const chats = { ...state.chats };
        chats[chatId] = {
          ...ensureChatState(chats, chatId),
          isLoading: true,
        };
        return { chats };
      });

      try {
        const currentChatState = ensureChatState(get().chats, chatId);
        const newMsgs = await workerController.listMessages(chatId, currentChatState.page);

        set((state) => {
          const chats = { ...state.chats };
          const chat = { ...ensureChatState(chats, chatId) };

          const timestamps = new Set(chat.ids);
          
          const mappedMsgs = newMsgs.map(mapCoreToFrontendMessage);
          const uniqueNewMsgs = mappedMsgs.filter(
            (msg) => !timestamps.has(msg.uuid)
          );

          const newMessages = { ...chat.messages };
          uniqueNewMsgs.forEach((msg) => {
            newMessages[msg.uuid] = msg;
          });
          chat.messages = newMessages;

          const newIds = uniqueNewMsgs.map((msg) => msg.uuid);
          chat.ids = [...newIds, ...chat.ids];

          if (newMsgs.length < 20) {
            chat.hasMore = false;
          } else {
            chat.page = chat.page + 1;
          }

          chat.isLoading = false;
          chats[chatId] = chat;
          return { chats };
        });
      } catch (e: any) {
        set((state) => {
          const chats = { ...state.chats };
          chats[chatId] = {
            ...ensureChatState(chats, chatId),
            isLoading: false,
          };
          return { chats };
        });
        throw new Error(`Could not load messages: ${e.message}`, e);
      }
    },

    sendMessage: async (chatId, content) => {
      const uuid = uuidv7();
      const userProfile = useUserStore.getState().userProfile;

      const newMessage: Message = {
        uuid,
        chatId,
        content,
        from: userProfile?.id || "",
        status: "sending",
      };

      set((state) => {
        const chats = { ...state.chats };
        const chat = { ...ensureChatState(chats, chatId) };

        chat.messages = {
          ...chat.messages,
          [uuid]: newMessage,
        };
        chat.ids = [...chat.ids, uuid];
        chats[chatId] = chat;

        return { chats };
      });

      try {
        const packet = {
          senderId: userProfile?.id || "",
          chatId,
          timestamp: new Date(),
          contentType: "text" as const,
          content,
        };
        await workerController.sendMessage(uuid, packet);
        set((state) => {
          const chats = { ...state.chats };
          const chat = { ...ensureChatState(chats, chatId) };

          if (chat.messages[uuid]) {
            chat.messages = {
              ...chat.messages,
              [uuid]: { ...chat.messages[uuid], status: "ok" },
            };
          }
          chats[chatId] = chat;
          return { chats };
        });
      } catch (e: any) {
        console.error(`Could not send message to ${chatId}: ${e}`);
        set((state) => {
          const chats = { ...state.chats };
          const chat = { ...ensureChatState(chats, chatId) };

          if (chat.messages[uuid]) {
            chat.messages = {
              ...chat.messages,
              [uuid]: { ...chat.messages[uuid], status: "error" },
            };
          }
          chats[chatId] = chat;
          return { chats };
        });
      }
    },

    resendMessage: async (chatId, messageId) => {
      const chat = get().chats[chatId];
      if (!chat) return;

      const message = chat.messages[messageId];
      if (!message) {
        console.error(
          "Impossible case where an unexisting message called its own resend function"
        );
        return;
      }

      set((state) => {
        const chats = { ...state.chats };
        const chatCopy = { ...ensureChatState(chats, chatId) };
        chatCopy.ids = chatCopy.ids.filter((id) => id !== messageId);
        const newMessages = { ...chatCopy.messages };
        delete newMessages[messageId];
        chatCopy.messages = newMessages;

        chats[chatId] = chatCopy;
        return { chats };
      });

      await get().sendMessage(chatId, message.content);
    },
  };
});
