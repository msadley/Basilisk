import { type } from "arktype";

export const profileSchema = type({
  id: "string",
  "name": "string | null",
  "avatar": "TypedArray.Uint8 | null",
});

export type Profile = typeof profileSchema.infer;
