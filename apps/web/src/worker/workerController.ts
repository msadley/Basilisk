import type {
  Chat,
  Message,
  MessagePacket,
  Profile,
  ResponseMap,
  SystemEvent,
  SystemEventMap,
  UIEventMap,
} from "@basilisk/core";
import mitt, { type Handler } from "mitt";
import { v7 as uuidv7 } from "uuid";

type PromiseControls = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

class WorkerController {
  worker: Worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
  emitter = mitt();
  pendingRequests = new Map<string, PromiseControls>();

  constructor() {
    this.worker.addEventListener("message", this.handleWorkerEvent);
    this.worker.postMessage({ type: "start-node" });
  }

  handleWorkerEvent = (event: MessageEvent<SystemEvent>) => {
    const { type, id } = event.data;
    const payload = "payload" in event.data ? event.data.payload : undefined;

    if (id && this.pendingRequests.has(id)) {
      if ("error" in event.data)
        this.pendingRequests.get(id)?.reject(event.data.error);
      else this.pendingRequests.get(id)?.resolve(payload);
    } else {
      // Só emitir se não houver promessa;
      if (type) this.emitter.emit(type, payload);
    }
  };

  on(type: SystemEvent["type"], handler: Handler<unknown>) {
    this.emitter.on(type, handler);
  }

  off(type: SystemEvent["type"], handler: Handler<unknown>) {
    this.emitter.off(type, handler);
  }

  private requestWorkerSetId<K extends keyof ResponseMap>(
    id: string,
    type: K,
    ...args: UIEventMap[K] extends void ? [] : [UIEventMap[K]]
  ): Promise<SystemEventMap[ResponseMap[K]]> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const message: { type: string; id: string; payload?: any } = { type, id };

      if (args.length > 0) {
        message.payload = args[0];
      }

      this.worker.postMessage(message);
    });
  }

  private requestWorker<K extends keyof ResponseMap>(
    type: K,
    ...args: UIEventMap[K] extends void ? [] : [UIEventMap[K]]
  ): Promise<SystemEventMap[ResponseMap[K]]> {
    return this.requestWorkerSetId(uuidv7(), type, ...args);
  }

  async getProfile(peerId: string): Promise<Profile> {
    return (
      await this.requestWorker("get-profile", {
        peerId,
      })
    ).profile;
  }

  async getUserProfile(): Promise<Profile> {
    return (await this.requestWorker("get-profile-user")).profile;
  }

  async patchUserProfile(name?: string, avatar?: string): Promise<Profile> {
    return (
      await this.requestWorker("patch-profile-self", {
        name,
        avatar,
      })
    ).profile;
  }

  async getChats(): Promise<Chat[]> {
    return (await this.requestWorker("get-chats")).chats;
  }

  async createChat(chat: Chat): Promise<Chat> {
    return (await this.requestWorker("create-chat", { chat })).chat;
  }

  async getMessages(chatId: string, page: number): Promise<Message[]> {
    return (
      await this.requestWorker("get-messages", {
        chatId,
        page,
      })
    ).messages;
  }

  async sendMessage(uuid: string, message: MessagePacket): Promise<void> {
    return await this.requestWorkerSetId(uuid, "send-message", { message });
  }

  async closeDatabase(): Promise<void> {
    await this.requestWorker("close-database");
  }

  async pingRelay(): Promise<number> {
    return (await this.requestWorker("ping-relay")).latency;
  }

  async subscribeToPeer(peerId: string): Promise<void> {
    await this.requestWorker("subscribe-to-peer", { peerId });
  }
}

export const workerController = new WorkerController();
