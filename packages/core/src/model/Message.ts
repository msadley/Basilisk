import { type } from "arktype";
import { baseMessageSchema } from "./BaseMessage.js";

const storedMessageSchema = type({
  id: "number",
  received: "boolean",
});

export const messageSchema = storedMessageSchema.and(baseMessageSchema);

export type Message = typeof messageSchema.infer;
