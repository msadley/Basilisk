import { workerController } from "../worker/workerController";
import { useChatStore } from "./ChatStore";
import { useUserStore } from "./UserStore";
import { useMessageStore } from "./MessageStore";
import { useConnectionStore } from "./ConnectionStore";

class RootStore {
  constructor() {
    workerController.on("node-started", this.loadSequence);
    workerController.on("message-received", this.messageReceive);
    workerController.on("chat-spawned", this.spawnChat);
    workerController.on("relay-lost", this.setIndicatorOff);
    workerController.on("relay-found", this.setIndicatorOn);
    workerController.on("peer-found", this.setPeerFound);
    workerController.on("peer-lost", this.setPeerLost);

    workerController.init().catch((e) => {
      console.error("Failed to initialize workerController", e);
    });
  }

  loadSequence = async () => {
    await Promise.all([
      useUserStore.getState().initialLoad(),
      useChatStore.getState().initialLoad(),
    ]);
  };

  messageReceive = async (event: any) => {
    await useMessageStore.getState().handleMessageReceived(event.message);
  };

  setIndicatorOff = async () => {
    useConnectionStore.getState().setUserConnectionFalse();
  };

  setIndicatorOn = async () => {
    useConnectionStore.getState().setUserConnectionTrue();
  };

  setPeerFound = async (event: any) => {
    useConnectionStore.getState().setConnectionTrue(event.peerId);
  };

  setPeerLost = async (event: any) => {
    useConnectionStore.getState().setConnectionFalse(event.peerId);
  };

  spawnChat = async (event: any) => {
    await useChatStore.getState().handleChatSpawn(event.chat);
  };
}

export const rootStore = new RootStore();
