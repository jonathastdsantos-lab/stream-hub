import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, username: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  getUser: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────
      user: null,
      isLoading: false,
      error: null,

      // ── Primitive Setters ──────────────────
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // ── Login ──────────────────────────────
      // Signs in with email/password via Supabase Auth
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          set({ user: data.user })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro ao fazer login'
          set({ error: message })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Signup ─────────────────────────────
      // Creates account and inserts profile row
      signup: async (email, password, username, displayName) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { username, display_name: displayName },
            },
          })
          if (error) throw error

          // Insert into public profiles table (if you have one)
          if (data.user) {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              username,
              display_name: displayName,
              email,
            })
          }

          set({ user: data.user })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro ao criar conta'
          set({ error: message })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Logout ─────────────────────────────
      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          set({ user: null })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro ao fazer logout'
          set({ error: message })
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Get User ───────────────────────────
      // Rehydrates session from Supabase on app init
      getUser: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.getUser()
          if (error) throw error
          set({ user: data.user })
        } catch {
          // Silent fail — user simply isn't logged in
          set({ user: null })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'streamhub-auth', // localStorage key
      partialize: (state) => ({ user: state.user }), // Only persist user, not loading/error
    }
  )
)

// ─────────────────────────────────────────────
// Auth state listener (call once in app root)
// ─────────────────────────────────────────────
// Usage: setupAuthListener() inside useEffect in App.tsx
export function setupAuthListener() {
  const { setUser } = useAuthStore.getState()
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })
  return data.subscription
}
