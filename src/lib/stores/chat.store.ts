import { create } from "zustand";

export type PlatformId = "youtube" | "twitch" | "kick" | "tiktok" | "facebook";

export interface ChatMsg {
  user: string;
  msg: string;
  platform: PlatformId;
  time: string;
}

interface ChatState {
  messages: ChatMsg[];
  chatFilter: string;
  addMessage: (msg: ChatMsg | ((prev: ChatMsg[]) => ChatMsg[])) => void;
  setMessages: (messages: ChatMsg[]) => void;
  setFilter: (chatFilter: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  chatFilter: "all",
  addMessage: (msg) =>
    set((state) => {
      const nextMsgs = typeof msg === "function" ? msg(state.messages) : [...state.messages, msg];
      // Cap at 100 messages to prevent excessive memory/render overhead
      if (nextMsgs.length > 100) {
        return { messages: nextMsgs.slice(nextMsgs.length - 100) };
      }
      return { messages: nextMsgs };
    }),
  setMessages: (messages) => set({ messages }),
  setFilter: (chatFilter) => set({ chatFilter }),
  clearMessages: () => set({ messages: [] }),
}));
