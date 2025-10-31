import { makeAutoObservable } from "mobx";
import type { View } from "../types";

class LayoutStore {
  view: View = { type: "home" };

  constructor() {
    makeAutoObservable(this);
  }

  setView = (view: View) => {
    this.view = view;
  };
}

export const layoutStore = new LayoutStore();
