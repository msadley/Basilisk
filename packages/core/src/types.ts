// packages/core/src/types.ts

export interface Profile {
  id: string;
  name?: string;
  avatar?: string;
}

export interface MessagePacket {
  content: string;
  timestamp: number;
  from: Profile;
  to: string;
}

export interface Message {
  id: number;
  content: string;
  timestamp: number;
  from: string;
}

export interface Config {
  privateKey: string;
  profile: Profile;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  type: "private" | "group";
}

export interface PrivateChat extends Chat {
  type: "private";
}

export interface GroupChat extends Chat {
  type: "group";
  members: Profile[];
}

export type WorkerCommand =
  | { type: "send-message"; payload: { toPeerId: string; text: string } };

export type UiEvent =
  | { type: "node-started"; payload: { peerId: string } }
  | { type: "message-received"; payload: { fromPeerId: string; text: string } };

export type SendToUiCallback = (event: UiEvent) => void;
