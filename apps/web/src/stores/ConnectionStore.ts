import { makeAutoObservable, observable } from "mobx";
import { workerController } from "../worker/workerController";

class ConnectionStore {
  isUserConnected: boolean = false;
  connectionStatuses = observable.map<string, boolean | undefined>();

  constructor() {
    makeAutoObservable(this);
  }

  setUserConnectionFalse = () => {
    this.isUserConnected = false;
  };

  setUserConnectionTrue = () => {
    this.isUserConnected = true;
  };

  addConnectionListener = (peerId: string) => {
    this.connectionStatuses.set(peerId, undefined);
    workerController.subscribeToPeer(peerId);
  };

  setConnectionFalse = (peerId: string) => {
    this.connectionStatuses.set(peerId, false);
  };

  setConnectionTrue = (peerId: string) => {
    this.connectionStatuses.set(peerId, true);
  };
}

export const connectionStore = new ConnectionStore();
