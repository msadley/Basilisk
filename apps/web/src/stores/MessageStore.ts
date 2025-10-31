import type { Message } from "@basilisk/core";
import { makeAutoObservable } from "mobx";
import { workerController } from "../worker/workerController";

class MessageStore {
  messages = new Map<string, Message[]>();
  pendingRequests: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  loadMore = async (chatId: string, page: number) => {
    const newMsgs = await workerController.getMessages(chatId, page);
    this.messages.set(chatId, [
      ...(this.messages.get(chatId) ?? []),
      ...newMsgs,
    ]);
  };

  sendMessage = async (chatId: string, content: string) => {
    await workerController.sendMessage(chatId, content);
  };
}

export const messageStore = new MessageStore();
