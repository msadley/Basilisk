// packages/core/src/types.ts

export interface Profile {
  nickname?: string;
  profilePicture?: string;
}

export interface Message {
  id?: number;
  content: string;
  timestamp: number;
  from: string;
  to: string;
}

export interface SavedMessage extends Message {
  id: number;
}

export interface Database {
  id: string;
  messages: SavedMessage[];
}

export interface Config {
  privateKey: string;
}
