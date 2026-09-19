import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as schema from "./database/databaseSchema.js";
import type { Chat } from "./model/Chat.js";
import { type Message } from "./model/Message.js";
import { Profile } from "./model/Profile.js";

interface PushEventMap {
  "node-started": { profile: Profile };
  "peer-found": { peerId: string };
  "peer-lost": { peerId: string };
  "chat-spawned": { chat: Chat };
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

export type AppDatabase = SqliteRemoteDatabase<typeof schema>;
