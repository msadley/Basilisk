import type { Profile } from "@basilisk/core";
import { makeAutoObservable, runInAction } from "mobx";
import { workerController } from "../worker/workerController";

class UserStore {
  userProfile: Profile | undefined;
  isLoading: boolean = true;

  constructor() {
    makeAutoObservable(this);
    workerController.on("node-started", this.initialLoad);
  }

  initialLoad = async () => {
    await this.getUserProfile();
  };

  getUserProfile = async () => {
    runInAction(() => {
      this.isLoading = true;
    });

    try {
      const userProfile = await workerController.getUserProfile();
      runInAction(() => {
        this.userProfile = userProfile;
        this.isLoading = false;
      });
    } catch (e) {
      console.error("Failed to get user profile", e);
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  get isProfileLoading(): boolean {
    return this.isLoading;
  }
}

export const userStore = new UserStore();
