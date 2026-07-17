import { create } from "zustand";
import type { Profile } from "@basilisk/core";
import { workerController } from "../worker/workerController";

interface ProfileState {
  profiles: Record<string, Profile>;
  getProfile: (peerId: string) => Promise<Profile>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: {},

  getProfile: async (peerId) => {
    const existing = get().profiles[peerId];
    if (existing) return existing;

    try {
      const profile = await workerController.getProfile(peerId);
      set((state) => ({
        profiles: {
          ...state.profiles,
          [peerId]: profile,
        },
      }));
      return profile;
    } catch (e: any) {
      throw new Error("Profile could not be retrieved", e);
    }
  },
}));
