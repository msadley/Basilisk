import { type } from "arktype";
import { privateChatSchema } from "./PrivateChat.js";

export const groupChatSchema = type.merge(privateChatSchema, {
  name: "string",
  image: "TypedArray.Uint8 | null",
});

export type GroupChat = typeof groupChatSchema.infer;
