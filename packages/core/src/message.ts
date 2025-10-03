// packages/core/src/message.ts
export interface Message {
  content: string | Buffer;
  timestamp: number;
  from: string;
  to: string;
}

export function createMessage(
  content: string | Buffer,
  timestamp: number,
  from: string,
  to: string
): Message {
  return { content, timestamp, from, to };
}
