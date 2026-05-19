import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Stream {
  id: string
  userId: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  status: 'offline' | 'live' | 'ended'
  platforms: string[]
  startedAt?: string | null
  endedAt?: string | null
  peakViewers: number
  totalMessages: number
  createdAt: string
}

export type StreamStatus = 'idle' | 'connecting' | 'live' | 'paused' | 'ended' | 'error'

export interface StreamConfig {
  title: string
  description?: string
  category?: string
  tags?: string[]
  isPrivate?: boolean
}

export interface StreamStats {
  viewers: number
  peakViewers: number
  duration: number
  bitrate: number
  fps: number
  resolution: string
  droppedFrames: number
}

interface StreamState {
  status: StreamStatus
  streamId: string | null
  streamKey: string | null
  rtmpUrl: string | null
  config: StreamConfig | null
  stats: StreamStats
  error: string | null
  startedAt: string | null
  isLoading: boolean
}

interface StreamActions {
  setStatus: (status: StreamStatus) => void
  setStats: (stats: Partial<StreamStats>) => void
  setError: (error: string | null) => void
  startStream: (config: StreamConfig) => Promise<{ success: boolean; streamId?: string; error?: string }>
  endStream: () => Promise<void>
  pauseStream: () => Promise<void>
  resumeStream: () => Promise<void>
  updateConfig: (updates: Partial<StreamConfig>) => void
  loadActiveStream: () => Promise<void>
}

type StreamStore = StreamState & StreamActions

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const DEFAULT_STATS: StreamStats = {
  viewers: 0,
  peakViewers: 0,
  duration: 0,
  bitrate: 0,
  fps: 0,
  resolution: '1920x1080',
  droppedFrames: 0,
}

let _statsInterval: any = null
let _durationInterval: any = null

const cleanIntervals = () => {
  if (_statsInterval) {
    clearInterval(_statsInterval)
    _statsInterval = null
  }
  if (_durationInterval) {
    clearInterval(_durationInterval)
    _durationInterval = null
  }
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useStreamStore = create<StreamStore>()((set, get) => ({
  // ── Initial State ────────────────────────
  status: 'idle',
  streamId: null,
  streamKey: null,
  rtmpUrl: null,
  config: null,
  stats: DEFAULT_STATS,
  error: null,
  startedAt: null,
  isLoading: false,

  // ── Primitive Setters ────────────────────
  setStatus: (status) => set({ status }),
  setStats: (stats) => set((state) => ({ stats: { ...state.stats, ...stats } })),
  setError: (error) => set({ error }),

  // ── Start Stream ─────────────────────────
  startStream: async (config) => {
    cleanIntervals()
    set({ status: 'connecting', error: null, isLoading: true })
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/streams/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to start stream')
      }

      const { streamId, streamKey, rtmpUrl } = await res.json()
      const startedAt = new Date().toISOString()

      set({
        status: 'live',
        streamId,
        streamKey,
        rtmpUrl,
        config,
        startedAt,
        stats: DEFAULT_STATS,
        isLoading: false,
      })

      // Polling for live stats
      _statsInterval = setInterval(async () => {
        try {
          const sId = get().streamId
          if (!sId) return
          const tokenStats = localStorage.getItem('auth_token')
          const statsRes = await fetch(`/api/streams/${sId}/stats`, {
            headers: { Authorization: `Bearer ${tokenStats}` },
          })
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            set((state) => ({
              stats: { ...state.stats, ...statsData },
            }))
          }
        } catch {
          // Silent fail
        }
      }, 5000)

      // Live duration counter
      const startMs = new Date(startedAt).getTime()
      _durationInterval = setInterval(() => {
        set((state) => ({
          stats: {
            ...state.stats,
            duration: Math.floor((Date.now() - startMs) / 1000),
          },
        }))
      }, 1000)

      return { success: true, streamId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar transmissão'
      set({ status: 'error', error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  // ── End Stream ───────────────────────────
  endStream: async () => {
    const { streamId } = get()
    cleanIntervals()
    if (!streamId) return

    set({ isLoading: true })
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`/api/streams/${streamId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Proceed regardless of API call failure
    }

    set({
      status: 'ended',
      streamKey: null,
      rtmpUrl: null,
      isLoading: false,
    })
  },

  // ── Pause Stream ─────────────────────────
  pauseStream: async () => {
    const { streamId } = get()
    if (!streamId) return

    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/streams/${streamId}/pause`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to pause stream')
      }
      set({ status: 'paused' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao pausar transmissão'
      set({ error: message })
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Resume Stream ────────────────────────
  resumeStream: async () => {
    const { streamId } = get()
    if (!streamId) return

    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/streams/${streamId}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to resume stream')
      }
      set({ status: 'live' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao resumir transmissão'
      set({ error: message })
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Update Config ────────────────────────
  updateConfig: (updates) => {
    set((state) => ({
      config: state.config ? { ...state.config, ...updates } : null,
    }))
  },

  // ── Load Active Stream ───────────────────
  // Fetches any currently active stream from DB on app init
  loadActiveStream: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('status', 'live')
        .maybeSingle()

      if (error) throw error

      if (data) {
        const startedAt = data.started_at || new Date().toISOString()
        set({
          status: 'live',
          streamId: data.id,
          config: {
            title: data.title,
            description: data.description || undefined,
          },
          startedAt,
          stats: {
            ...DEFAULT_STATS,
            peakViewers: data.peak_viewers || 0,
          },
        })

        // Restart intervals
        _statsInterval = setInterval(async () => {
          try {
            const tokenStats = localStorage.getItem('auth_token')
            const statsRes = await fetch(`/api/streams/${data.id}/stats`, {
              headers: { Authorization: `Bearer ${tokenStats}` },
            })
            if (statsRes.ok) {
              const statsData = await statsRes.json()
              set((state) => ({
                stats: { ...state.stats, ...statsData },
              }))
            }
          } catch {
            // Silent fail
          }
        }, 5000)

        const startMs = new Date(startedAt).getTime()
        _durationInterval = setInterval(() => {
          set((state) => ({
            stats: {
              ...state.stats,
              duration: Math.floor((Date.now() - startMs) / 1000),
            },
          }))
        }, 1000)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar transmissão ativa'
      set({ error: message })
    } finally {
      set({ isLoading: false })
    }
  },
}))
