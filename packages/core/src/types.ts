// packages/core/src/types.ts

export interface Profile {
  id: string;
  name?: string;
  avatar?: string;
}

export interface MessagePacket {
  id?: number;
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

export interface Database {
  profile: Profile;
  messages: Message[];
}

export interface Config {
  privateKey: string;
  profile: {
    id: string;
    name?: string;
    avatar?: string;
  };
}
