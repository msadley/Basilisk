import { makeAutoObservable } from "mobx";

class ConnectionStore {
  isConnected: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setConnectionFalse = () => {
    this.isConnected = false;
  };

  setConnectionTrue = () => {
    this.isConnected = true;
  };
}

export const connectionStore = new ConnectionStore();
