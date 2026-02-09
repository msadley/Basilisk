import { makeAutoObservable, observable } from "mobx";
import type {
  MainView,
  ModalView,
  SidePanelView,
  ToastMessage,
} from "../types";
import { v7 as uuidv7 } from "uuid";

class LayoutStore {
  mainView: MainView = { type: "home" };
  sidePanelView: SidePanelView = { type: "none" };
  modalView: ModalView = { type: "none" };
  toasts = observable<ToastMessage>([]);

  constructor() {
    makeAutoObservable(this);
  }

  setMainView = (view: MainView) => {
    this.mainView = view;
  };

  setSidePanelView = (view: SidePanelView) => {
    this.sidePanelView = view;
  };

  setModalView = (view: ModalView) => {
    this.modalView = view;
  };

  get currentToast(): ToastMessage | undefined {
    return this.toasts.length > 0 ? this.toasts[0] : undefined;
  }

  addToast = (message: string, type: ToastMessage["type"], duration = 3000) => {
    const id = uuidv7();
    this.toasts.push({
      id,
      message,
      type,
      duration,
    });
  };

  removeToast = (id: string) => {
    this.toasts = observable.array(
      this.toasts.filter((toast) => toast.id !== id),
    );
  };
}

export const layoutStore = new LayoutStore();
