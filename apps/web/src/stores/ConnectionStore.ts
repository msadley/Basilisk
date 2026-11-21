import { create } from "zustand";

interface ConnectionState {
  peers: Record<string, boolean>;
  isConnectedToRelay: boolean;
  setPeers: (peers: Record<string, boolean>) => void;
  setPeerStatus: (peerId: string, connected: boolean) => void;
  removePeer: (peerId: string) => void;
  setConnectedToRelay: (connected: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  peers: {},
  isConnectedToRelay: false,

  setPeers: (peers) => set({ peers }),

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

  removePeer: (peerId) =>
    set((state) => {
      if (!(peerId in state.peers)) {
        return state;
      }
      const { [peerId]: _, ...rest } = state.peers;
      return { peers: rest };
    }),

  setConnectedToRelay: (connected) =>
    set((state) =>
      state.isConnectedToRelay === connected
        ? state
        : { isConnectedToRelay: connected },
    ),
}));
