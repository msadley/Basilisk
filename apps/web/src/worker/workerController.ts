import type { PushEvent } from "@basilisk/core";
import * as Comlink from "comlink";
import mitt, { Emitter } from "mitt";
import { BasiliskInitializer, Services } from "./worker";

const RELAY_ADDRESS = import.meta.env.VITE_RELAY_ADDRESS;

type PushEventMap = {
  [T in PushEvent["type"]]: Extract<PushEvent, { type: T }>;
};

class WorkerController {
  public services!: Services;
  private worker!: Worker;
  private eventEmitter!: Emitter<PushEventMap>;

  private constructor() {}

  static async init(): Promise<WorkerController> {
    const controller = new WorkerController();
    controller.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    controller.eventEmitter = mitt<PushEventMap>();

    const basiliskInitializer = Comlink.wrap<BasiliskInitializer>(
      controller.worker,
    );

    const services = await basiliskInitializer.init(
      RELAY_ADDRESS,
      controller.eventEmitter,
    );

    controller.services = services;
    return controller;
  }

  on<T extends keyof PushEventMap>(
    eventType: T,
    handler: (e: PushEventMap[T]) => void,
  ) {
    this.eventEmitter.on(eventType, handler);
  }

  off<T extends keyof PushEventMap>(eventType: T) {
    this.eventEmitter.off(eventType);
  }
}

export const workerController = await WorkerController.init();
