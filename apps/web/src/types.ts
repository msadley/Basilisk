type MainViewsFromMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends void ? { type: K } : { type: K; details: T[K] };
}[keyof T];

interface MainViewMap {
  home: void;
  addChat: void;
  chat: { chatId: string };
}

export type MainView = MainViewsFromMap<MainViewMap>;

type SidePanelViewsFromMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends void ? { type: K } : { type: K; details: T[K] };
}[keyof T];

interface SidePanelViewMap {
  none: void;
}

type ModalViewsFromMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends void ? { type: K } : { type: K; details: T[K] };
}[keyof T];

interface ModalViewMap {
  loading: void;
  none: void;
}
export type ModalView = ModalViewsFromMap<ModalViewMap>;

export type SidePanelView = SidePanelViewsFromMap<SidePanelViewMap>;

export interface ButtonProps {
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}
