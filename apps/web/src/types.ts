export type View = {
  type: string;
  id?: string;
  name?: string;
};

export type Message = {
  id?: number;
  content: string;
  timestamp: number;
  from: string;
  to: string;
};

export type Database = {
  id: string;
  messages: Message[];
};

export interface Contact {
  id: string;
  name: string;
  profilePicture?: string;
}

export interface Profile {
  id: string;
  addresses?: string[];
  name?: string;
  profilePicture?: string;
}