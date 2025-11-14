import { makeAutoObservable, observable, runInAction } from "mobx";
import { workerController } from "../worker/workerController";
import { userStore } from "./UserStore";
import { v7 as uuidv7 } from "uuid";

export type Message = {
  uuid: string;
  content: string;
  from: string;
  chatId: string;
  status: "sending" | "error" | "ok";
};

class ChatState {
  messages = observable.map<string, Message>();
  ids = observable.array<string>();

  page: number = 0;
  hasMore: boolean = true;
  isLoading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  get sortedMessages(): Message[] {
    return this.ids.map((time) => this.messages.get(time)!);
  }
}

class MessageStore {
  chats = new Map<string, ChatState>();

  constructor() {
    makeAutoObservable(this);
  }

  getChatMessages(chatId: string): Message[] {
    return this.getChatState(chatId).sortedMessages;
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
      if (!state.messages.has(message.uuid)) {
        state.messages.set(message.uuid, { ...message, status: "ok" });
        state.ids.push(message.uuid);
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
        const timestamps = new Set(state.ids);
        const uniqueNewMsgs = newMsgs.filter(
          (msg) => !timestamps.has(msg.uuid)
        );

        uniqueNewMsgs.forEach((msg) => {
          state.messages.set(msg.uuid, {
            ...msg,
            status: "ok",
          });
        });

        uniqueNewMsgs.forEach((msg) => {
          state.ids.unshift(msg.uuid);
        });

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
    const uuid = uuidv7();
    const newMessage: Message = {
      uuid,
      chatId,
      content,
      from: userStore.userProfile!.id,
      status: "sending",
    };
    runInAction(() => {
      const chat = this.getChatState(chatId);
      chat.messages.set(uuid, newMessage);
      chat.ids.push(uuid);
    });

    try {
      await workerController.sendMessage(uuid, newMessage);
      runInAction(() => {
        const state = this.getChatState(chatId);
        const message = state.messages.get(uuid)!;
        state.messages.set(uuid, { ...message, status: "ok" });
      });
    } catch (e: any) {
      console.error(`Could not send message to ${chatId}: ${e}`);
      runInAction(() => {
        const state = this.getChatState(chatId);
        const message = state.messages.get(uuid)!;
        state.messages.set(uuid, { ...message, status: "error" });
      });
    }
  };
}

export const messageStore = new MessageStore();
