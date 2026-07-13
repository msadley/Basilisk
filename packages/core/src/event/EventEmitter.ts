import { ArkErrors } from "arktype";
import {
  SystemEventSchema,
  type SystemEvent,
  type SystemEventMap,
  type uiCallbackFn,
} from "../types.js";

type EventResult<K extends keyof SystemEventMap> = SystemEventMap[K] extends
  void | undefined
  ? [result?: { error: string } | void]
  : [
      result:
        | ({ error?: never } & SystemEventMap[K])
        | ({ error: string } & { [P in keyof SystemEventMap[K]]?: never }),
    ];

class EventEmitter {
  private callbackFn: uiCallbackFn;

  constructor(callbackFn: uiCallbackFn) {
    this.callbackFn = callbackFn;
  }

  emit<K extends keyof SystemEventMap>(
    id: string,
    eventType: K,
    ...args: EventResult<K>
  ): void;

  emit(id: string, eventType: keyof SystemEventMap, result?: any): void;

  emit(id: string, eventType: keyof SystemEventMap, ...args: any[]) {
    const result = args[0];
    const rawEvent: Record<string, unknown> = {
      type: eventType,
      id,
    };

    if (result && typeof result === "object" && "error" in result) {
      rawEvent.error = result.error;
    } else if (result !== undefined) {
      rawEvent.payload = result;
    }

    const validationResult = SystemEventSchema(rawEvent);

    if (validationResult instanceof ArkErrors) {
      console.error(
        `[EventEmitter] Failed to emit '${eventType}'. Invalid payload:`,
        validationResult.summary,
      );
      return;
    }

    this.callbackFn(validationResult as SystemEvent);
  }
}

export default EventEmitter;
