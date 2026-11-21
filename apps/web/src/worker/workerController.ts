import type { PushEvent } from "@basilisk/core";
import * as Comlink from "comlink";
import mitt, { Emitter } from "mitt";
import { BasiliskInitializer, Services } from "./worker";

const RELAY_ADDRESS = import.meta.env.VITE_RELAY_MULTIADDRESS;

type PushEventMap = {
  [T in PushEvent["type"]]: Extract<PushEvent, { type: T }>;
};

class WorkerController {
  public services!: Services;
  private worker!: Worker;
  private eventEmitter!: Emitter<PushEventMap>;
  private constructor() {}

  static async create(): Promise<WorkerController> {
    const relayAddress =
      typeof RELAY_ADDRESS === "string" ? RELAY_ADDRESS.trim() : "";
    if (
      !relayAddress ||
      !relayAddress.startsWith("/") ||
      relayAddress === "/"
    ) {
      throw new Error(
        "VITE_RELAY_MULTIADDRESS must be configured as a valid multiaddress starting with '/' (e.g. /dns4/your-dns.com/tcp/443/wss/p2p/...).",
      );
    }

    const controller = new WorkerController();
    controller.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    controller.eventEmitter = mitt<PushEventMap>();

    const basiliskInitializer = Comlink.wrap<BasiliskInitializer>(
      controller.worker,
    );

    const services = await basiliskInitializer.init(
      relayAddress,
      Comlink.proxy({
        emit: (event: PushEvent) =>
          controller.eventEmitter.emit(event.type, event),
      }),
    );

    controller.services = services;
    return controller;
  }

  async init() {
    return this.services.nodeService.start();
  }

  on<T extends keyof PushEventMap>(
    eventType: T,
    handler: (e: PushEventMap[T]) => void,
  ) {
    this.eventEmitter.on(eventType, handler);
  }

  off<T extends keyof PushEventMap>(
    eventType: T,
    handler?: (e: PushEventMap[T]) => void,
  ) {
    this.eventEmitter.off(eventType, handler);
  }
}

export const workerController = await WorkerController.create();
