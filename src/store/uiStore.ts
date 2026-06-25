import { create } from 'zustand';

type UIState = {
  isOffline: boolean;
  syncPending: boolean;
  lastSyncTime: number | null;
  setOffline: (offline: boolean) => void;
  setSyncPending: (pending: boolean) => void;
  setLastSyncTime: (timestamp: number | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isOffline: false,
  syncPending: false,
  lastSyncTime: null,
  setOffline: (offline) => set({ isOffline: offline }),
  setSyncPending: (pending) => set({ syncPending: pending }),
  setLastSyncTime: (timestamp) => set({ lastSyncTime: timestamp }),
}));


