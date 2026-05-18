import { create } from "zustand";

interface UiState {
  activeTab: string;
  setActiveTab: (activeTab: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (activeTab) => set({ activeTab }),
}));
