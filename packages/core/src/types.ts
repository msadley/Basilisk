import type { BatchItem, BatchResponse } from "drizzle-orm/batch";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./database/databaseSchema.js";
import { type Message } from "./model/Message.js";
import { Profile } from "./model/Profile.js";

interface PushEventMap {
  "node-started": { profile: Profile };
  "peer-found": { peerId: string };
  "peer-lost": { peerId: string };
  "message-received": { message: Message };
  "relay-found": void;
  "relay-lost": void;
}

export type PushEvent = {
  [K in keyof PushEventMap]: PushEventMap[K] extends void
    ? { type: K }
    : { type: K; payload: PushEventMap[K] };
}[keyof PushEventMap];

export interface WorkerEventSink {
  emit(event: PushEvent): void;
}

export type AppDatabase = BaseSQLiteDatabase<"async", any, typeof schema> & {
  batch<U extends BatchItem<"sqlite">, T extends Readonly<[U, ...U[]]>>(
    batch: T,
  ): Promise<BatchResponse<T>>;
};
