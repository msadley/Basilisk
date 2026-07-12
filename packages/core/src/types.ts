import { type } from "arktype";
import { type Message } from "./model/Message.js";
import { type Profile } from "./model/Profile.js";
import type { Chat } from "./model/Chat.js";
import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./database/databaseSchema.js";

export interface SystemEventMap {
  "node-started": { profile: Profile };
  "chat-created": { chat: Chat };
  "chat-spawned": { chat: Chat };
  "chats-retrieved": { chats: Chat[] };
  "user-profile-updated": { profile: Profile };
  "profile-received": { profile: Profile };
  "message-received": { message: Message };
  "messages-retrieved": { messages: Message[] };
  "pong-relay": { latency: number };
  "peer-found": { peerId: string };
  "peer-lost": { peerId: string };
  "message-sent": void;
  "relay-found": void;
  "relay-lost": void;
}

export interface UIEventMap {
  "list-messages": { chatId: string; limit: number; page: number };
  "send-message": { chatId: string; content: string };
  "get-profile": { peerId: string };
  "get-user-profile": void;
  "update-profile": { name?: string; avatar?: Uint8Array | undefined };
  "list-chats": void;
  "create-private-chat": { peerId: string };
  "ping-relay": void;
}

export const UIEventSchema = type({
  id: "string",
  type: "string",
  "payload?": "unknown",
});

export const SystemEventSchema = type({
  id: "string",
  type: "string",
  "payload?": "unknown",
  "error?": "string",
});

export type UIEvent = {
  [K in keyof UIEventMap]: {
    id: string;
    type: K;
  } & (UIEventMap[K] extends void | undefined
    ? { payload?: never }
    : { payload: UIPayload<K> });
}[keyof UIEventMap];

export type SystemEvent = {
  [K in keyof SystemEventMap]: {
    id: string;
    type: K;
  } & (SystemEventMap[K] extends void | undefined
    ? { error?: never; payload?: never } | { error: string; payload?: never }
    : | { error?: never; payload: SystemEventMap[K] }
      | { error: string; payload?: never });
}[keyof SystemEventMap];

export type SystemPayload<T extends keyof SystemEventMap> = SystemEventMap[T];
export type UIPayload<T extends keyof UIEventMap> = T extends "send-message"
  ? { chatId: string; content: string }
  : UIEventMap[T];

export const responseMap = {
  "list-messages": "messages-retrieved",
  "send-message": "message-sent",
  "get-profile": "profile-received",
  "get-user-profile": "user-profile-updated",
  "update-profile": "user-profile-updated",
  "list-chats": "chats-retrieved",
  "create-private-chat": "chat-created",
  "close-database": "database-closed",
  "wipe-database": "database-wiped",
  "ping-relay": "pong-relay",
} as const;

export type ResponseMap = typeof responseMap;
export type uiCallbackFn = (event: SystemEvent) => void;

export type AppDatabase = BaseSQLiteDatabase<"async", any, typeof schema>;
