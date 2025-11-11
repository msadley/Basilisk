import type { Profile } from "@basilisk/core";
import { makeAutoObservable, runInAction } from "mobx";
import { workerController } from "../worker/workerController";

class ProfileStore {
  profiles = new Map<string, Profile>();

  constructor() {
    makeAutoObservable(this);
  }

  getProfile = async (peerId: string): Promise<Profile> => {
    if (this.profiles.get(peerId)) return this.profiles.get(peerId)!;

    try {
      const profile = await workerController.getProfile(peerId);
      runInAction(() => {
        this.profiles.set(peerId, profile);
      });
      return profile;
    } catch (e: any) {
      throw new Error("Profile could not be retrieved", e);
    }
  };
}

export const profileStore = new ProfileStore();
