import type { Chat, PrivateChat, Profile } from "@basilisk/core";
import { create } from "zustand";
import { workerController } from "../worker/workerController";
import { useConnectionStore } from "./ConnectionStore";
import { queryKeys } from "./keys";
import { appendMessageToCache } from "./MessageStore";
import { upsertProfileInCache } from "./ProfileStore";
import { queryClient } from "./queryClient";

/** Builds a PrivateChat cache entry on demand for a newly started private chat. */
const buildPrivateChat = (chatId: string): PrivateChat => {
  const userProfile = queryClient.getQueryData<Profile>(queryKeys.userProfile);
  return {
    id: chatId,
    participants:
      userProfile && userProfile.id !== chatId
        ? [chatId, userProfile.id]
        : [chatId],
  };
};

/** Ensures a chat cache entry exists before appending incoming messages. */
const ensureChatInCache = (chatId: string) => {
  const existingChats = queryClient.getQueryData<Chat[]>(queryKeys.chats);
  const cachedFromList = existingChats?.find((chat) => chat.id === chatId);
  const cachedChat = queryClient.getQueryData<Chat | null>(
    queryKeys.chat(chatId),
  );

  if (cachedFromList) {
    // Replace stale negative cache if useChat queried before the chat existed.
    if (cachedChat === null) {
      queryClient.setQueryData<Chat>(queryKeys.chat(chatId), cachedFromList);
    }
    return;
  }

  const chat = cachedChat ?? buildPrivateChat(chatId);

  if (!existingChats) {
    queryClient.invalidateQueries({ queryKey: queryKeys.chats });
  } else {
    queryClient.setQueryData<Chat[]>(queryKeys.chats, (old) => {
      if (!old) return old;
      return old.some((existing) => existing.id === chat.id)
        ? old
        : [...old, chat];
    });
  }

  queryClient.setQueryData<Chat>(queryKeys.chat(chat.id), chat);
};

export type StartupStatus = "idle" | "initializing" | "ready" | "error";

export interface StartupState {
  status: StartupStatus;
  error: Error | null;
}

export const useStartupStore = create<StartupState>(() => ({
  status: "idle",
  error: null,
}));

class RootStore {
  private listenersAttached = false;
  private initPromise: Promise<void> | null = null;

  private attachEventListeners() {
    if (this.listenersAttached) {
      return;
    }
    this.listenersAttached = true;

    workerController.on("message-received", (e) => {
      const { message } = e.payload;
      ensureChatInCache(message.chatId);
      appendMessageToCache(queryClient, message.chatId, message);
    });

    workerController.on("peer-found", (e) => {
      const { peerId } = e.payload;
      useConnectionStore.getState().setPeerStatus(peerId, true);

      void workerController.services.profileService
        .fetchPeerProfile(peerId)
        .then((profile) => {
          upsertProfileInCache(queryClient, profile);
        })
        .catch(() => {
          // Peer may disconnect before profile exchange completes.
        });
    });

    workerController.on("peer-lost", (e) => {
      useConnectionStore.getState().setPeerStatus(e.payload.peerId, false);
    });

    workerController.on("relay-found", () => {
      useConnectionStore.getState().setConnectedToRelay(true);
    });

    workerController.on("relay-lost", () => {
      useConnectionStore.getState().setConnectedToRelay(false);
    });
  }

  init(): Promise<void> {
    if (useStartupStore.getState().status === "ready") {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.runInit().finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  private async runInit(): Promise<void> {
    useStartupStore.setState({ status: "initializing", error: null });
    this.attachEventListeners();

    try {
      const services = await workerController.getServices();
      queryClient.setQueryData(
        queryKeys.userProfile,
        await services.profileService.getUserProfile(),
      );
      await workerController.init();
      useStartupStore.setState({ status: "ready", error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to initialize RootStore", error);
      useStartupStore.setState({ status: "error", error });
    }
  }
}

export const rootStore = new RootStore();
