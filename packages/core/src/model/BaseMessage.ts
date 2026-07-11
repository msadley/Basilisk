import { type } from "arktype";

export const contentTypeSchema = type("'image' | 'text' | 'file'");

const commonMessageSchema = type({
  senderId: "string",
  chatId: "string",
  timestamp: "Date",
});

const imageMessageSchema = commonMessageSchema.and({
  contentType: "'image'",
  content: "TypedArray.Uint8",
});

const textMessageSchema = commonMessageSchema.and({
  contentType: "'text'",
  content: "string",
});

const fileMessageSchema = commonMessageSchema.and({
  contentType: "'file'",
  content: "TypedArray.Uint8",
});

export const baseMessageSchema = imageMessageSchema
  .or(textMessageSchema)
  .or(fileMessageSchema);
