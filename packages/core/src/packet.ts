// packages/core/src/message.ts
export interface Packet {
  type: string;
  content: string | Buffer;
  timestamp: number;
  from: string;
  to: string;
}

export function createPacket(
  type: string,
  content: string | Buffer,
  timestamp: number,
  from: string,
  to: string
): Packet {
  return { type, content, timestamp, from, to };
}
