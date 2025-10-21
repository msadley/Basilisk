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
