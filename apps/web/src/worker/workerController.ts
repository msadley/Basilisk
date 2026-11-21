import type { PushEvent } from "@basilisk/core";
import * as Comlink from "comlink";
import mitt, { Emitter } from "mitt";
import type { BasiliskInitializer, Services } from "./worker";

const RELAY_ADDRESS = import.meta.env.VITE_RELAY_MULTIADDRESS;

type PushEventMap = {
  [T in PushEvent["type"]]: Extract<PushEvent, { type: T }>;
};

class WorkerController {
  private _services: Comlink.Remote<Services> | null = null;
  private worker: Worker | null = null;
  private initializerProxy: Comlink.Remote<BasiliskInitializer> | null = null;
  private initPromise: Promise<Comlink.Remote<Services>> | null = null;
  private readonly eventEmitter: Emitter<PushEventMap> = mitt<PushEventMap>();

  get services(): Comlink.Remote<Services> {
    if (!this._services) {
      throw new Error(
        "WorkerController is not initialized. Call ensureInitialized() or getServices() first.",
      );
    }
    return this._services;
  }

  async ensureInitialized(): Promise<Comlink.Remote<Services>> {
    if (this._services) {
      return this._services;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeWorker().catch((error) => {
      this.cleanupWorker();
      throw error;
    });

    return this.initPromise;
  }

  async getServices(): Promise<Comlink.Remote<Services>> {
    return this.ensureInitialized();
  }

  private async initializeWorker(): Promise<Comlink.Remote<Services>> {
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

    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker = worker;

    const basiliskInitializer = Comlink.wrap<BasiliskInitializer>(worker);
    this.initializerProxy = basiliskInitializer;

    let onError: ((event: ErrorEvent) => void) | null = null;
    let onMessageError: (() => void) | null = null;

    const workerFailurePromise = new Promise<never>((_resolve, reject) => {
      onError = (event: ErrorEvent) => {
        reject(
          event.error instanceof Error
            ? event.error
            : new Error(event.message || "Worker initialization failed"),
        );
      };
      onMessageError = () => {
        reject(new Error("Worker message deserialization failed"));
      };
      worker.addEventListener("error", onError, { once: true });
      worker.addEventListener("messageerror", onMessageError, { once: true });
    });

    try {
      const initializedServices = await Promise.race([
        basiliskInitializer.init(
          relayAddress,
          Comlink.proxy({
            emit: (event: PushEvent) =>
              this.eventEmitter.emit(event.type, event),
          }),
        ),
        workerFailurePromise,
      ]);

      this._services = initializedServices;
      return initializedServices;
    } finally {
      if (onError) {
        worker.removeEventListener("error", onError);
      }
      if (onMessageError) {
        worker.removeEventListener("messageerror", onMessageError);
      }
    }
  }

  private cleanupWorker(): void {
    try {
      this.initializerProxy?.[Comlink.releaseProxy]?.();
    } catch {
      // Ignore cleanup errors on partially initialized proxies
    }
    if (this.worker) {
      this.worker.terminate();
    }
    this.worker = null;
    this.initializerProxy = null;
    this._services = null;
    this.initPromise = null;
  }

  async init(): Promise<void> {
    const services = await this.ensureInitialized();
    await services.nodeService.start();
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

export const workerController = new WorkerController();
