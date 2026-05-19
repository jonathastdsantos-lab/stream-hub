import { create } from 'zustand'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ActiveTab = 'live' | 'platforms' | 'chat' | 'analytics' | 'settings'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  durationMs?: number // Auto-dismiss duration (undefined = persistent)
}

interface UIState {
  activeTab: ActiveTab
  modalOpen: Record<string, boolean>
  notifications: Notification[]
}

interface UIActions {
  setActiveTab: (tab: ActiveTab) => void
  openModal: (name: string) => void
  closeModal: (name: string) => void
  toggleModal: (name: string) => void
  isModalOpen: (name: string) => boolean
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

type UIStore = UIState & UIActions

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

let _notifCounter = 0
function generateId(): string {
  return `notif-${Date.now()}-${++_notifCounter}`
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useUIStore = create<UIStore>()((set, get) => ({
  // ── Initial State ────────────────────────
  activeTab: 'live',
  modalOpen: {},
  notifications: [],

  // ── Tab Navigation ───────────────────────
  setActiveTab: (activeTab) => set({ activeTab }),

  // ── Modal Controls ───────────────────────
  openModal: (name) =>
    set((state) => ({ modalOpen: { ...state.modalOpen, [name]: true } })),

  closeModal: (name) =>
    set((state) => ({ modalOpen: { ...state.modalOpen, [name]: false } })),

  toggleModal: (name) => {
    const current = get().modalOpen[name] ?? false
    set((state) => ({ modalOpen: { ...state.modalOpen, [name]: !current } }))
  },

  // Read-only helper — does not mutate state
  isModalOpen: (name) => get().modalOpen[name] ?? false,

  // ── Notifications ─────────────────────────
  // Returns the generated ID so callers can dismiss early if needed
  addNotification: (notification) => {
    const id = generateId()
    const full: Notification = { id, durationMs: 4000, ...notification }

    set((state) => ({ notifications: [...state.notifications, full] }))

    // Auto-dismiss after durationMs if set
    if (full.durationMs) {
      setTimeout(() => {
        get().removeNotification(id)
      }, full.durationMs)
    }

    return id
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAllNotifications: () => set({ notifications: [] }),
}))

// ─────────────────────────────────────────────
// Convenience helpers (use outside components)
// ─────────────────────────────────────────────

/** Quick-fire a success notification from anywhere */
export const notify = {
  success: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'error', title, message, durationMs: 6000 }),
  warning: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'info', title, message }),
}
