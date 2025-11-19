import type { Chat } from "@basilisk/core";
import type { ReactNode } from "react";

type MainViewsFromMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends void ? { type: K } : { type: K; details: T[K] };
}[keyof T];

interface MainViewMap {
  home: void;
  addChat: void;
  chat: { chat: Chat };
}

export type MainView = MainViewsFromMap<MainViewMap>;

type SidePanelViewsFromMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends void ? { type: K } : { type: K; details: T[K] };
}[keyof T];

interface SidePanelViewMap {
  none: void;
  settings: void;
}

export type SidePanelView = SidePanelViewsFromMap<SidePanelViewMap>;

export interface ViewProps {
  setHeader: (element: ReactNode) => void;
  setFooter: (element: ReactNode) => void;
}

export interface ButtonProps {
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}
