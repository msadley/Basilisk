import { type } from "arktype";

export const privateChatSchema = type({
  id: "string",
  participants: "string[]",
});

export type PrivateChat = typeof privateChatSchema.infer;
