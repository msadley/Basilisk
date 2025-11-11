import type { Chat } from "@basilisk/core";
import { makeAutoObservable, runInAction } from "mobx";
import { workerController } from "../worker/workerController";

class ChatStore {
  chats: Chat[] = [];
  isLoading: boolean = true;

  constructor() {
    makeAutoObservable(this);
  }

  initialLoad = async () => {
    await this.getChats();
  };

  getChats = async () => {
    runInAction(() => {
      this.isLoading = true;
    });

    try {
      const chats = await workerController.getChats();
      runInAction(() => {
        this.chats = chats;
        this.isLoading = false;
      });
    } catch (e) {
      console.error("Failed to get chats", e);
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  createChat = async (chat: Chat) => {
    try {
      const newChat = await workerController.createChat(chat);
      runInAction(() => {
        this.chats.push(newChat);
      });
      return newChat;
    } catch (e) {
      console.error("Failed to create chat", e);
    }
  };

  get areChatsLoading(): boolean {
    return this.isLoading;
  }
}

export const chatStore = new ChatStore();
