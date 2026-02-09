import { makeAutoObservable } from "mobx";
import { workerController } from "../worker/workerController";

class RootStore {
  constructor() {
    makeAutoObservable(this);
    workerController.on("node-started", this.loadSequence);
    workerController.on("message-received", this.messageReceive);
    workerController.on("chat-spawned", this.spawnChat);
    workerController.on("relay-lost", this.setIndicatorOff);
    workerController.on("relay-found", this.setIndicatorOn);
    workerController.on("peer-found", this.setPeerFound);
    workerController.on("peer-lost", this.setPeerLost);
  }

  loadSequence = async () => {
    const { chatStore } = await import("./ChatStore");
    const { userStore } = await import("./UserStore");

    await Promise.all([userStore.initialLoad(), chatStore.initialLoad()]);
  };

  messageReceive = async (event: any) => {
    const { messageStore } = await import("./MessageStore");

    await messageStore.handleMessageReceived(event.message);
  };

  setIndicatorOff = async () => {
    const { connectionStore } = await import("./ConnectionStore");

    connectionStore.setUserConnectionFalse();
  };

  setIndicatorOn = async () => {
    const { connectionStore } = await import("./ConnectionStore");

    connectionStore.setUserConnectionTrue();
  };

  setPeerFound = async (event: any) => {
    const { connectionStore } = await import("./ConnectionStore");

    connectionStore.setConnectionTrue(event.peerId);
  };

  setPeerLost = async (event: any) => {
    const { connectionStore } = await import("./ConnectionStore");

    connectionStore.setConnectionFalse(event.peerId);
  };

  spawnChat = async (event: any) => {
    const { chatStore } = await import("./ChatStore");

    chatStore.handleChatSpawn(event.chat);
  };
}

export const rootStore = new RootStore();
