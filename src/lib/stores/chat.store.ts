import { create } from "zustand";

export type PlatformId = "youtube" | "twitch" | "kick" | "tiktok" | "facebook";

export interface ChatMsg {
  id: string;
  user: string;
  msg: string;
  platform: PlatformId;
  time: string;
  hidden?: boolean;
  spamAlert?: boolean;
  linkAlert?: boolean;
}

interface ChatState {
  messages: ChatMsg[];
  chatFilter: string;
  bannedUsers: string[];
  addMessage: (msg: Omit<ChatMsg, "id"> & { id?: string }) => void;
  setMessages: (messages: ChatMsg[]) => void;
  setFilter: (chatFilter: string) => void;
  banUser: (username: string) => void;
  unbanUser: (username: string) => void;
  hideMessage: (msgId: string) => void;
  revealMessage: (msgId: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  chatFilter: "all",
  bannedUsers: [],

  addMessage: (msg) =>
    set((state) => {
      // If user is already banned, reject message
      if (state.bannedUsers.includes(msg.user.toLowerCase())) {
        return {};
      }

      const id = msg.id || `msg_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      const fullMsg: ChatMsg = { ...msg, id };

      const nextMsgs = [...state.messages, fullMsg];

      // Cap at 100 messages to prevent excessive memory/render overhead
      if (nextMsgs.length > 100) {
        return { messages: nextMsgs.slice(nextMsgs.length - 100) };
      }
      return { messages: nextMsgs };
    }),

  setMessages: (messages) => set({ messages }),

  setFilter: (chatFilter) => set({ chatFilter }),

  banUser: (username) =>
    set((state) => {
      const lowerUser = username.toLowerCase();
      const updatedBanned = state.bannedUsers.includes(lowerUser)
        ? state.bannedUsers
        : [...state.bannedUsers, lowerUser];

      // Filter out all messages from this user
      const updatedMessages = state.messages.filter(
        (m) => m.user.toLowerCase() !== lowerUser
      );

      return {
        bannedUsers: updatedBanned,
        messages: updatedMessages,
      };
    }),

  unbanUser: (username) =>
    set((state) => ({
      bannedUsers: state.bannedUsers.filter((u) => u !== username.toLowerCase()),
    })),

  hideMessage: (msgId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === msgId ? { ...m, hidden: true } : m
      ),
    })),

  revealMessage: (msgId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === msgId ? { ...m, hidden: false } : m
      ),
    })),

  clearMessages: () => set({ messages: [] }),
}));
