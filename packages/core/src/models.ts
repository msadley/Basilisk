import type { Message } from "./model/Message.js";

export type { Chat } from "./model/Chat.js";
export { groupChatSchema, type GroupChat } from "./model/GroupChat.js";
export { messageSchema, type Message } from "./model/Message.js";
export {
  messagePacketSchema,
  type MessagePacket,
} from "./model/MessagePacket.js";
export { privateChatSchema, type PrivateChat } from "./model/PrivateChat.js";
export { profileSchema, type Profile } from "./model/Profile.js";

interface PushEventMap {
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
