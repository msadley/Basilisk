import type { Chat } from "@basilisk/core";
import { create } from "zustand";
import { workerController } from "../worker/workerController";

interface ChatState {
  chats: Chat[];
  isLoading: boolean;
  handleChatSpawn: (chat: Chat) => Promise<void>;
  initialLoad: () => Promise<void>;
  getChats: () => Promise<void>;
  createChat: (chat: Chat) => Promise<Chat | undefined>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  isLoading: true,

  handleChatSpawn: async (chat) => {
    set((state) => ({ chats: [...state.chats, chat] }));
  },

  initialLoad: async () => {
    await get().getChats();
  },

  getChats: async () => {
    set({ isLoading: true });
    try {
      const chats = await workerController.listChats();
      set({ chats, isLoading: false });
    } catch (e) {
      console.error("Failed to get chats", e);
      set({ isLoading: false });
    }
  },

  createChat: async (chat) => {
    try {
      const newChat = await workerController.createPrivateChat(chat.id);
      set((state) => ({ chats: [...state.chats, newChat] }));
      return newChat;
    } catch (e) {
      console.error("Failed to create chat", e);
    }
  },
}));
