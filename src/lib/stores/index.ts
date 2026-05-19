// ─────────────────────────────────────────────
// StreamHub — Zustand Stores
// Central export barrel. Import from here everywhere.
//
// Usage:
//   import { useAuthStore, useStreamStore } from '@/lib/stores'
// ─────────────────────────────────────────────

// Auth — Supabase session, login, signup, logout
export { useAuthStore, setupAuthListener } from './auth.store'

// Stream — current stream lifecycle + realtime viewer count
export { useStreamStore } from './stream.store'
export type { Stream } from './stream.store'

// Chat — messages list, platform filter, realtime subscription
export { useChatStore } from './chat.store'
export type { Message } from './chat.store'

// Platforms — connected platform accounts (YouTube, Twitch, etc.)
export { usePlatformStore } from './platform.store'
export type { PlatformConnection } from './platform.store'

// UI — tabs, modals, toast notifications
export { useUIStore, notify } from './ui.store'
export type { ActiveTab, Notification, NotificationType } from './ui.store'
