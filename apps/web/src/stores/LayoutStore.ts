import { create } from "zustand";
import type {
  MainView,
  ModalView,
  SidePanelView,
  ToastMessage,
} from "../types";
import { v7 as uuidv7 } from "uuid";

interface LayoutState {
  mainView: MainView;
  sidePanelView: SidePanelView;
  modalView: ModalView;
  toasts: ToastMessage[];
  theme: "mocha" | "macchiato" | "frappe" | "latte";
  setTheme: (theme: "mocha" | "macchiato" | "frappe" | "latte") => void;
  setMainView: (view: MainView) => void;
  setSidePanelView: (view: SidePanelView) => void;
  setModalView: (view: ModalView) => void;
  addToast: (message: string, type: ToastMessage["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}

const getInitialTheme = (): "mocha" | "macchiato" | "frappe" | "latte" => {
  const savedTheme = localStorage.getItem("basilisk-theme");
  if (savedTheme && ["mocha", "macchiato", "frappe", "latte"].includes(savedTheme)) {
    return savedTheme as any;
  }
  return "mocha";
};

const applyTheme = (theme: string) => {
  const root = document.documentElement;
  root.className = `theme-${theme}`;
};

// Apply the initial theme immediately
applyTheme(getInitialTheme());

export const useLayoutStore = create<LayoutState>((set) => ({
  mainView: { type: "home" },
  sidePanelView: { type: "none" },
  modalView: { type: "none" },
  toasts: [],
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem("basilisk-theme", theme);
    applyTheme(theme);
    set({ theme });
  },

  setMainView: (view) => set({ mainView: view }),
  setSidePanelView: (view) => set({ sidePanelView: view }),
  setModalView: (view) => set({ modalView: view }),

  addToast: (message, type, duration = 3000) => {
    const id = uuidv7();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));
