import type { Basilisk, SystemEvent } from "@basilisk/core";
import * as Comlink from "comlink";
import { BasiliskInitializer } from "./worker";
import { v7 as uuidv7 } from "uuid";

class WorkerController {
  private basilisk!: Comlink.Remote<Basilisk>;
  private worker!: Worker;

  private constructor() {}

  static async create(relayAddress: string): Promise<WorkerController> {
    const controller = new WorkerController();
    controller.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    const basiliskInitializer = Comlink.wrap<BasiliskInitializer>(
      controller.worker,
    );
    const basilisk = await basiliskInitializer.init({
      callbackFn: Comlink.proxy(controller.handleWorkerEvent),
      relayAddress,
    });

    controller.basilisk = basilisk;
    return controller;
  }

  handleWorkerEvent = (event: SystemEvent) => {};

  async getProfile(peerId: string) {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "get-profile",
      payload: { peerId },
    });
  }

  async getUserProfile() {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "get-user-profile",
    });
  }

  async updateProfile(name?: string, avatar?: Uint8Array<ArrayBufferLike>) {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "update-profile",
      payload: { name, avatar },
    });
  }

  async getChats() {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "get-chats",
    });
  }

  async createPrivateChat(peerId: string) {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "create-private-chat",
      payload: { peerId },
    });
  }

  async getMessages(chatId: string, limit: number, page: number) {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "get-messages",
      payload: { chatId, limit, page },
    });
  }

  async sendMessage(chatId: string, content: string) {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "send-message",
      payload: { chatId, content },
    });
  }

  async pingRelay() {
    return await this.basilisk.handleEvent({
      id: uuidv7(),
      type: "ping-relay",
    });
  }
}

export const workerController = await WorkerController.create(
  import.meta.env.VITE_RELAY_ADDRESS,
);
