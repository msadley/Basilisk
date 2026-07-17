import type { Profile } from "@basilisk/core";
import { create } from "zustand";
import { workerController } from "../worker/workerController";

interface UserState {
  userProfile: Profile | undefined;
  isLoading: boolean;
  initialLoad: () => Promise<void>;
  getUserProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userProfile: undefined,
  isLoading: true,

  initialLoad: async () => {
    await get().getUserProfile();
  },

  getUserProfile: async () => {
    set({ isLoading: true });

    try {
      const userProfile = await workerController.getUserProfile();
      set({ userProfile, isLoading: false });
    } catch (e) {
      console.error("Failed to get user profile", e);
      set({ isLoading: false });
    }
  },
}));
