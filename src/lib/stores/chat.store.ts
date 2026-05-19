import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Message {
  id: string
  streamId: string
  platform: 'youtube' | 'twitch' | 'tiktok' | 'facebook' | 'kick'
  username: string
  message: string
  userColor?: string
  isMod: boolean
  createdAt: string
}

type PlatformFilter = 'all' | 'youtube' | 'twitch' | 'tiktok' | 'facebook' | 'kick'

const MAX_MESSAGES = 50 // Max messages kept in memory

interface ChatState {
  messages: Message[]
  filter: PlatformFilter
  isLoading: boolean
  autoScroll: boolean
  _realtimeChannel: RealtimeChannel | null
}

interface ChatActions {
  addMessage: (message: Message) => void
  deleteMessage: (messageId: string) => void
  setFilter: (filter: PlatformFilter) => void
  clearMessages: () => void
  setMessages: (messages: Message[]) => void
  prependMessages: (messages: Message[]) => void
  setAutoScroll: (enabled: boolean) => void
  subscribeToChat: (streamId: string) => void
  unsubscribeFromChat: () => void
  getFilteredMessages: () => Message[]
}

type ChatStore = ChatState & ChatActions

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useChatStore = create<ChatStore>()((set, get) => ({
  // ── Initial State ────────────────────────
  messages: [],
  filter: 'all',
  isLoading: false,
  autoScroll: true,
  _realtimeChannel: null,

  // ── Add Message ──────────────────────────
  // Appends a message and trims the list to MAX_MESSAGES
  addMessage: (message) => {
    set((state) => {
      const updated = [...state.messages, message]
      // Keep only the last MAX_MESSAGES to avoid memory bloat
      return { messages: updated.slice(-MAX_MESSAGES) }
    })
  },

  // ── Delete Message ───────────────────────
  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }))
  },

  // ── Set Filter ───────────────────────────
  setFilter: (filter) => set({ filter }),

  // ── Clear All ────────────────────────────
  clearMessages: () => set({ messages: [] }),

  // ── Replace All ──────────────────────────
  // Used for initial load — replaces the full list
  setMessages: (messages) => set({ messages: messages.slice(-MAX_MESSAGES) }),

  // ── Prepend (History) ────────────────────
  // Prepends older messages (e.g. on scroll-up pagination)
  prependMessages: (messages) => {
    set((state) => {
      const combined = [...messages, ...state.messages]
      return { messages: combined.slice(-MAX_MESSAGES) }
    })
  },

  // ── Auto-scroll ──────────────────────────
  setAutoScroll: (autoScroll) => set({ autoScroll }),

  // ── Derived: Filtered Messages ───────────
  // Returns messages matching the current platform filter
  getFilteredMessages: () => {
    const { messages, filter } = get()
    if (filter === 'all') return messages
    return messages.filter((m) => m.platform === filter)
  },

  // ── Realtime Subscription ─────────────────
  // Listens for new chat_messages on a specific stream
  subscribeToChat: (streamId) => {
    get().unsubscribeFromChat() // Clean up previous

    const channel = supabase
      .channel(`chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const msg: Message = {
            id: row.id as string,
            streamId: row.stream_id as string,
            platform: row.platform as Message['platform'],
            username: row.username as string,
            message: row.message as string,
            userColor: row.user_color as string | undefined,
            isMod: row.is_mod as boolean,
            createdAt: row.created_at as string,
          }
          get().addMessage(msg)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const row = payload.old as Record<string, unknown>
          get().deleteMessage(row.id as string)
        }
      )
      .subscribe()

    set({ _realtimeChannel: channel })
  },

  unsubscribeFromChat: () => {
    const { _realtimeChannel } = get()
    if (_realtimeChannel) {
      supabase.removeChannel(_realtimeChannel)
      set({ _realtimeChannel: null })
    }
  },
}))
