import * as Comlink from "comlink";
import Basilisk from "./Basilisk.js";

export * from "./types.js";
export { profileSchema, type Profile } from "./model/Profile.js";
export { messageSchema, type Message } from "./model/Message.js";
export {
  messagePacketSchema,
  type MessagePacket,
} from "./model/MessagePacket.js";
export type { Chat } from "./model/Chat.js";
export { privateChatSchema, type PrivateChat } from "./model/PrivateChat.js";
export { groupChatSchema, type GroupChat } from "./model/GroupChat.js";

Comlink.expose(Basilisk);
