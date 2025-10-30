import type { Chat, Message, Profile, SystemEvent } from "@basilisk/core";
import mitt, { type Handler } from "mitt";

type PromiseControls = {
  resolve: (params: any) => any;
  reject: (params: any) => any;
};

class WorkerController {
  worker: Worker;
  emitter;
  pendingRequests: Map<string, PromiseControls>;

  constructor() {
    this.worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
    this.emitter = mitt();
    this.pendingRequests = new Map<string, PromiseControls>();
    this.worker.addEventListener("message", this.handleWorkerEvent);
  }

  handleWorkerEvent(event: MessageEvent<SystemEvent>) {
    const { type, payload, id, error } = event.data;

    if (id && this.pendingRequests.has(id)) {
      if (error) this.pendingRequests.get(id)?.reject(error);
      else this.pendingRequests.get(id)?.resolve(payload);
    } else {
      // Só emitir se não houver promessa;
      if (type) this.emitter.emit(type, payload);
    }
  }

  on(type: SystemEvent["type"], handler: Handler<unknown>) {
    this.emitter.on(type, handler);
  }

  off(type: SystemEvent["type"], handler: Handler<unknown>) {
    this.emitter.off(type, handler);
  }

  getProfile(peerId: string) {
    return new Promise<Profile>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "get-profile",
        payload: { peerId },
        id,
      });
    });
  }

  getUserProfile() {
    return new Promise<Profile>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "get-profile-self",
        id,
      });
    });
  }

  patchUserProfile(name?: string, avatar?: string) {
    return new Promise<Profile>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "patch-profile-self",
        payload: { name, avatar },
        id,
      });
    });
  }

  getChats() {
    return new Promise<Chat[]>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "get-chats",
        id,
      });
    });
  }

  createChat(chat: Chat) {
    return new Promise<void>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "create-chat",
        payload: { chat },
        id,
      });
    });
  }

  getMessages(chatId: string, pages: number) {
    return new Promise<Message[]>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "get-messages",
        payload: { chatId, pages },
        id,
      });
    });
  }

  sendMessage(chatId: string, content: string) {
    return new Promise<number>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "send-message",
        payload: { chatId, content },
        id,
      });
    });
  }
}

export const workerService = new WorkerController();
