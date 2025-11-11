import type { Chat } from "@basilisk/core";
import type { ReactNode } from "react";

type ViewsFromMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends void ? { type: K } : { type: K; details: T[K] };
}[keyof T];

interface ViewMap {
  home: void;
  addChat: void;
  settings: void;
  chat: { chat: Chat };
}

export type View = ViewsFromMap<ViewMap>;

export interface ViewProps {
  setHeader: (element: ReactNode) => void;
  setFooter: (element: ReactNode) => void;
  setLeftPanel: (element: ReactNode) => void;
  setRightPanel: (element: ReactNode) => void;
}

export interface ButtonProps {
  onClick: () => void;
}
