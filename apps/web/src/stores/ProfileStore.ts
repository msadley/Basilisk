import type { Profile } from "@basilisk/core";
import { makeAutoObservable } from "mobx";
import { workerController } from "../worker/workerController";

class ProfileStore {
  profiles = new Map<string, Profile>();

  constructor() {
    makeAutoObservable(this);
  }

  getProfile = async (peerId: string) => {
    this.profiles.set(peerId, await workerController.getProfile(peerId));
  };
}

export const profileStore = new ProfileStore();
