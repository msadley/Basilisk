import type { Chat, PrivateChat, Profile } from "@basilisk/core";
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

class RootStore {
  private constructor() {
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

  static async init() {
    queryClient.setQueryData(
      queryKeys.userProfile,
      await workerController.services.profileService.getUserProfile(),
    );
    const store = new RootStore();
    await workerController.init().catch((e) => {
      console.error("Failed to initialize workerController", e);
    });
    return store;
  }
}

export const rootStore = RootStore.init();
