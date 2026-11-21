import { create } from "zustand";

interface ConnectionState {
  peers: Record<string, boolean>;
  isConnectedToRelay: boolean;
  setPeerStatus: (peerId: string, connected: boolean) => void;
  setConnectedToRelay: (connected: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  peers: {},
  isConnectedToRelay: false,

  setPeerStatus: (peerId, connected) =>
    set((state) => {
      if (state.peers[peerId] === connected) {
        return state;
      }
      return {
        peers: {
          ...state.peers,
          [peerId]: connected,
        },
      };
    }),

  setConnectedToRelay: (connected) =>
    set((state) =>
      state.isConnectedToRelay === connected
        ? state
        : { isConnectedToRelay: connected },
    ),
}));
