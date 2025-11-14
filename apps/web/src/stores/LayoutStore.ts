import { makeAutoObservable } from "mobx";
import type { MainView, SidePanelView } from "../types";

class LayoutStore {
  mainView: MainView = { type: "home" };
  sidePanelView: SidePanelView = { type: "none" };

  constructor() {
    makeAutoObservable(this);
  }

  setMainView = (view: MainView) => {
    this.mainView = view;
  };

  setSidePanelView = (view: SidePanelView) => {
    this.sidePanelView = view;
  };
}

export const layoutStore = new LayoutStore();
