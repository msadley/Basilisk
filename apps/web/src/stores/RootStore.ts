import { makeAutoObservable } from "mobx";
import { workerController } from "../worker/workerController";
import { chatStore } from "./ChatStore";
import { userStore } from "./UserStore";

class RootStore {
  constructor() {
    makeAutoObservable(this);
    workerController.on("node-started", this.loadSequence);
  }

  loadSequence = async () => {
    await Promise.all([userStore.initialLoad(), chatStore.initialLoad()]);
  };
}

new RootStore();
