import { create } from "zustand";

interface StreamState {
  currentStream: any | null;
  isLive: boolean;
  viewers: number;
  duration: number;
  streamHistory: any[];
  setStream: (currentStream: any | null) => void;
  setLive: (isLive: boolean) => void;
  setViewers: (viewers: number) => void;
  setDuration: (duration: number | ((prev: number) => number)) => void;
  setStreamHistory: (streamHistory: any[]) => void;
  clearStream: () => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  currentStream: null,
  isLive: false,
  viewers: 0,
  duration: 0,
  streamHistory: [],
  setStream: (currentStream) => set({ currentStream }),
  setLive: (isLive) => set({ isLive }),
  setViewers: (viewers) => set({ viewers }),
  setDuration: (duration) =>
    set((state) => ({
      duration: typeof duration === "function" ? duration(state.duration) : duration,
    })),
  setStreamHistory: (streamHistory) => set({ streamHistory }),
  clearStream: () => set({ currentStream: null, isLive: false, viewers: 0, duration: 0 }),
}));
