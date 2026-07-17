import EventEmitter from "./event/EventEmitter.js";
import EventRouter from "./event/EventRouter.js";
import NodeCore from "./node/NodeCore.js";
import { container } from "tsyringe";
import {
  responseMap,
  type AppDatabase,
  type UIEvent,
  type uiCallbackFn,
} from "./types.js";
import IdentityService from "./service/IdentityService.js";

export class Basilisk {
  private eventRouter: EventRouter;
  private eventEmitter: EventEmitter;

  private constructor(
    eventRouter: EventRouter,
    eventEmitter: EventEmitter,
  ) {
    this.eventRouter = eventRouter;
    this.eventEmitter = eventEmitter;
  }

  static async init(
    drizzleDriver: AppDatabase,
    callbackFn: uiCallbackFn,
    relayAddress: string,
  ) {
    container.register<AppDatabase>("AppDatabase", { useValue: drizzleDriver });
    container.register<string>("RelayAddress", { useValue: relayAddress });
    container.register<uiCallbackFn>("CallbackFn", { useValue: callbackFn });

    const identityService = container.resolve(IdentityService);

    const privateKey = await identityService.getPrivateKey();
    const nodeCore = await NodeCore.init(relayAddress, privateKey);
    nodeCore.start();
    container.register<NodeCore>("NodeCore", { useValue: nodeCore });

    const eventEmitter = container.resolve(EventEmitter);
    const eventRouter = container.resolve(EventRouter);

    return new Basilisk(eventRouter, eventEmitter);
  }

  async handleEvent(event: UIEvent) {
    const result = await this.eventRouter.route(event);
    const responseType = responseMap[event.type];
    if (responseType) {
      this.eventEmitter.emit(event.id, responseType, result);
    }
    return result;
  }
}
