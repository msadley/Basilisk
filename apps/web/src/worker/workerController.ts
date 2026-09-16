import type { SystemEvent } from "@basilisk/core";
import * as Comlink from "comlink";
import { BasiliskInitializer, Services } from "./worker";
import mitt from "mitt";

const RELAY_ADDRESS = import.meta.env.VITE_RELAY_ADDRESS;

class WorkerController {
  public services!: Services;
  private worker!: Worker;
  private eventEmitter = mitt<Record<SystemEvent["type"], SystemEvent>>();

  private constructor() {}

  static async init(): Promise<WorkerController> {
    const controller = new WorkerController();
    controller.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    const basiliskInitializer = Comlink.wrap<BasiliskInitializer>(
      controller.worker,
    );

    const services = await basiliskInitializer.init(
      RELAY_ADDRESS,
      Comlink.proxy(controller.handleWorkerEvent),
    );

    controller.services = services;
    return controller;
  }

  handleWorkerEvent = (event: SystemEvent) => {
    this.eventEmitter.emit(event.type, event);
  };
}

export const workerController = await WorkerController.init();
