// packages/core/src/types.ts

export interface Profile {
  id: string;
  name?: string;
  avatar?: string;
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
  profile: Profile;
  messages: SavedMessage[];
}

export interface Config {
  privateKey: string;
  profile: {
    id: string;
    name?: string;
    avatar?: string;
  };
}
