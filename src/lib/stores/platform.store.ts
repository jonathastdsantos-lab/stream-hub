import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PlatformConnection {
  id: string
  userId: string
  platform: 'youtube' | 'twitch' | 'tiktok' | 'facebook' | 'kick'
  accessToken: string
  refreshToken?: string
  expiresAt?: string | null
  streamKey?: string
  rtmpUrl?: string
  channelId: string
  channelName: string
  isActive: boolean
  connectedAt: string
}

interface PlatformState {
  platforms: PlatformConnection[]
  selectedPlatform: string | null
  isLoading: boolean
  error: string | null
}

interface PlatformActions {
  setPlatforms: (platforms: PlatformConnection[]) => void
  addPlatform: (platform: PlatformConnection) => void
  removePlatform: (platformId: string) => Promise<void>
  updatePlatform: (platformId: string, data: Partial<PlatformConnection>) => Promise<void>
  setSelectedPlatform: (platform: string | null) => void
  getPlatform: (platformId: string) => PlatformConnection | undefined
  loadPlatforms: () => Promise<void>
  validateConnections: () => Promise<void>
  setError: (error: string | null) => void
}

type PlatformStore = PlatformState & PlatformActions

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Maps a raw Supabase row to our PlatformConnection shape */
function rowToConnection(row: Record<string, unknown>): PlatformConnection {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    platform: row.platform as PlatformConnection['platform'],
    accessToken: row.access_token as string,
    refreshToken: row.refresh_token as string | undefined,
    expiresAt: row.expires_at as string | null,
    streamKey: row.stream_key as string | undefined,
    rtmpUrl: row.rtmp_url as string | undefined,
    channelId: row.channel_id as string,
    channelName: row.channel_name as string,
    isActive: row.is_active as boolean,
    connectedAt: row.connected_at as string,
  }
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const usePlatformStore = create<PlatformStore>()((set, get) => ({
  // ── Initial State ────────────────────────
  platforms: [],
  selectedPlatform: null,
  isLoading: false,
  error: null,

  // ── Primitive Setters ────────────────────
  setPlatforms: (platforms) => set({ platforms }),
  setSelectedPlatform: (selectedPlatform) => set({ selectedPlatform }),
  setError: (error) => set({ error }),

  // ── Get single platform ──────────────────
  getPlatform: (platformId) =>
    get().platforms.find((p) => p.id === platformId),

  // ── Add Platform ─────────────────────────
  // Optimistically adds to local state; caller handles DB insert
  addPlatform: (platform) => {
    set((state) => ({ platforms: [...state.platforms, platform] }))
  },

  // ── Remove Platform ──────────────────────
  removePlatform: async (platformId) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('platform_connections')
        .delete()
        .eq('id', platformId)

      if (error) throw error

      set((state) => ({
        platforms: state.platforms.filter((p) => p.id !== platformId),
        // Deselect if we just removed the selected platform
        selectedPlatform:
          state.selectedPlatform === platformId ? null : state.selectedPlatform,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover plataforma'
      set({ error: message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Update Platform ───────────────────────
  updatePlatform: async (platformId, data) => {
    set({ isLoading: true, error: null })
    try {
      // Build snake_case payload for Supabase
      const dbPayload: Record<string, unknown> = {}
      if (data.isActive !== undefined) dbPayload.is_active = data.isActive
      if (data.accessToken) dbPayload.access_token = data.accessToken
      if (data.refreshToken) dbPayload.refresh_token = data.refreshToken
      if (data.expiresAt) dbPayload.expires_at = data.expiresAt
      if (data.streamKey) dbPayload.stream_key = data.streamKey
      if (data.rtmpUrl) dbPayload.rtmp_url = data.rtmpUrl
      if (data.channelName) dbPayload.channel_name = data.channelName

      const { error } = await supabase
        .from('platform_connections')
        .update(dbPayload)
        .eq('id', platformId)

      if (error) throw error

      // Merge update into local state
      set((state) => ({
        platforms: state.platforms.map((p) =>
          p.id === platformId ? { ...p, ...data } : p
        ),
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar plataforma'
      set({ error: message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Load Platforms ────────────────────────
  // Fetches all connections for the current user on app init
  loadPlatforms: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('connected_at', { ascending: true })

      if (error) throw error

      set({ platforms: (data ?? []).map(rowToConnection) })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar plataformas'
      set({ error: message })
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Validate Connections ──────────────────
  // Marks platforms as inactive if their token has expired
  validateConnections: async () => {
    const { platforms, updatePlatform } = get()
    const now = new Date()

    for (const platform of platforms) {
      if (platform.expiresAt) {
        const expired = new Date(platform.expiresAt) < now
        if (expired && platform.isActive) {
          await updatePlatform(platform.id, { isActive: false }).catch(() => {
            // Non-fatal: log and continue
            console.warn(`[PlatformStore] Failed to deactivate expired platform ${platform.id}`)
          })
        }
      }
    }
  },
}))
