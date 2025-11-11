import type { Message } from "@basilisk/core";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { workerController } from "../worker/workerController";
import type { UUID } from "crypto";

export type MessagePlaceholder = {
  id: UUID;
  chatId: string;
  content: string;
  error: boolean;
};

class ChatState {
  messages = observable.map<number, Message>();

  ids = observable.array<number>();

  messagePlaceholders = observable.map<string, MessagePlaceholder>();

  page: number = 0;
  hasMore: boolean = true;
  isLoading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  get sortedMessages(): Message[] {
    return this.ids.map((id) => this.messages.get(id)!);
  }
}

class MessageStore {
  chats = new Map<string, ChatState>();
  pendingRequests: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  getChatMessages(chatId: string): Message[] {
    return this.getChatState(chatId).sortedMessages;
  }

  getSendingMessages(chatId: string): MessagePlaceholder[] {
    const sendingMessages = [
      ...this.getChatState(chatId).messagePlaceholders.values(),
    ];
    if (!sendingMessages) return [];
    return sendingMessages;
  }

  getChatState(chatId: string): ChatState {
    if (!this.chats.has(chatId)) {
      runInAction(() => {
        this.chats.set(chatId, new ChatState());
      });
    }
    return this.chats.get(chatId)!;
  }

  handleMessageReceived = async (message: Message) => {
    const chatId = message.chatId.includes("group-")
      ? message.chatId
      : message.from;

    const state = this.getChatState(chatId);

    runInAction(() => {
      if (!state.messages.has(message.id)) {
        state.messages.set(message.id, message);
        state.ids.push(message.id);
      }
    });
  };

  loadMore = async (chatId: string) => {
    const state = this.getChatState(chatId);

    if (!state.hasMore || state.isLoading) {
      return;
    }

    runInAction(() => {
      state.isLoading = true;
    });

    try {
      const newMsgs = await workerController.getMessages(chatId, state.page);

      runInAction(() => {
        // Create a Set of existing IDs for O(1) lookup
        const existingIds = new Set(state.ids);

        // Filter out messages that already exist
        const uniqueNewMsgs = newMsgs.filter((msg) => !existingIds.has(msg.id));

        // Add messages to the map
        uniqueNewMsgs.forEach((msg) => {
          state.messages.set(msg.id, msg);
        });

        // Add IDs to the front of the array (older messages)
        uniqueNewMsgs.forEach((msg) => {
          state.ids.unshift(msg.id);
        });

        // Update pagination state
        if (newMsgs.length < 20) {
          state.hasMore = false;
        } else {
          state.page++;
        }
      });
    } catch (e: any) {
      throw new Error(`Could not load messages: ${e.message}`, e);
    } finally {
      runInAction(() => {
        state.isLoading = false;
      });
    }
  };

  sendMessage = async (chatId: string, content: string) => {
    const uuid = crypto.randomUUID();
    const placeholder = {
      id: uuid,
      chatId,
      content,
    };
    runInAction(() => {
      this.getChatState(chatId).messagePlaceholders.set(uuid, {
        ...placeholder,
        error: false,
      });
    });

    try {
      const sentMessage = await workerController.sendMessage(
        chatId,
        content,
        uuid
      );

      const state = this.getChatState(chatId);

      runInAction(() => {
        if (!state.messages.has(sentMessage.id)) {
          state.messages.set(sentMessage.id, sentMessage);
          state.ids.push(sentMessage.id);
        }
      });
    } catch (e: any) {
      console.error(`Could not send message to ${chatId}: ${e}`);
      runInAction(() => {
        this.getChatState(chatId).messagePlaceholders.set(uuid, {
          ...placeholder,
          error: true,
        });
      });
    }
  };
}

export const messageStore = new MessageStore();
