import { create } from "zustand";

interface ConnectionState {
  isUserConnected: boolean;
  connectionStatuses: Record<string, boolean | undefined>;
  setUserConnectionFalse: () => void;
  setUserConnectionTrue: () => void;
  addConnectionListener: (peerId: string) => void;
  setConnectionFalse: (peerId: string) => void;
  setConnectionTrue: (peerId: string) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isUserConnected: false,
  connectionStatuses: {},

  setUserConnectionFalse: () => set({ isUserConnected: false }),
  setUserConnectionTrue: () => set({ isUserConnected: true }),

  addConnectionListener: (peerId) => {
    set((state) => ({
      connectionStatuses: {
        ...state.connectionStatuses,
        [peerId]: undefined,
      },
    }));
  },

  setConnectionFalse: (peerId) => {
    set((state) => ({
      connectionStatuses: {
        ...state.connectionStatuses,
        [peerId]: false,
      },
    }));
  },

  setConnectionTrue: (peerId) => {
    set((state) => ({
      connectionStatuses: {
        ...state.connectionStatuses,
        [peerId]: true,
      },
    }));
  },
}));
