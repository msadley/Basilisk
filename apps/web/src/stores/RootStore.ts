import { makeAutoObservable } from "mobx";
import { workerController } from "../worker/workerController";

class RootStore {
  constructor() {
    makeAutoObservable(this);
    workerController.on("node-started", this.loadSequence);
  }

  loadSequence = async () => {
    const { chatStore } = await import("./ChatStore");
    const { userStore } = await import("./UserStore");

    await Promise.all([userStore.initialLoad(), chatStore.initialLoad()]);
  };
}

export const rootStore = new RootStore();
