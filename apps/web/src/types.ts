type ViewsFromMap<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends void ? { type: K } : { type: K; details: T[K] };
}[keyof T];

type MainViewMap = {
  home: void;
  addChat: void;
  chat: { chatId: string };
};

export type MainView = ViewsFromMap<MainViewMap>;

type SidePanelViewMap = {
  none: void;
};

export type SidePanelView = ViewsFromMap<SidePanelViewMap>;

type ModalViewMap = {
  loading: void;
  none: void;
};

export type ModalView = ViewsFromMap<ModalViewMap>;

export interface ButtonProps {
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}
