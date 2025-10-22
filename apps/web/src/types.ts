import type { ReactNode } from "react";

export type View = {
  type: string;
  id?: string;
  name?: string;
};

export interface ViewProps {
  setHeader: (element: ReactNode) => void;
  setFooter: (element: ReactNode) => void;
}

export interface ButtonProps {
  onClick: () => void;
}

export interface Profile {
  id: string;
  name?: string;
  avatar?: string;
}

export interface Message {
  id: number;
  content: string;
  timestamp: number;
  from: string;
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
