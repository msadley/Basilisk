import { baseMessageSchema } from "./BaseMessage.js";

export const messagePacketSchema = baseMessageSchema;

export type MessagePacket = typeof messagePacketSchema.infer;
