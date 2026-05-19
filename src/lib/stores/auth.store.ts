/**
 * @file auth.store.ts
 * @description Store de autenticação — gerencia sessão do usuário,
 * tokens JWT, perfil e estado de login/logout.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Timestamp (ms) de expiração do accessToken */
  expiresAt: number;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  // --- Estado ---
  user: User | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  error: string | null;

  // --- Ações ---
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  refreshSession: (tokens: AuthTokens) => void;

  // --- Seletores computados ---
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        tokens: null,
        status: 'idle',
        error: null,

        // Atualiza apenas o usuário
        setUser: (user) => set({ user }, false, 'auth/setUser'),

        // Atualiza apenas os tokens
        setTokens: (tokens) => set({ tokens }, false, 'auth/setTokens'),

        // Atualiza o status da autenticação
        setStatus: (status) => set({ status }, false, 'auth/setStatus'),

        // Define mensagem de erro (null para limpar)
        setError: (error) => set({ error }, false, 'auth/setError'),

        /**
         * Login completo: persiste usuário + tokens e marca como autenticado.
         */
        login: (user, tokens) =>
          set(
            { user, tokens, status: 'authenticated', error: null },
            false,
            'auth/login',
          ),

        /**
         * Logout: limpa todos os dados sensíveis.
         */
        logout: () =>
          set(
            { user: null, tokens: null, status: 'unauthenticated', error: null },
            false,
            'auth/logout',
          ),

        /**
         * Atualiza tokens após refresh sem alterar o usuário.
         */
        refreshSession: (tokens) =>
          set({ tokens, status: 'authenticated' }, false, 'auth/refreshSession'),

        // Verifica se há usuário autenticado
        isAuthenticated: () => get().status === 'authenticated' && get().user !== null,

        // Verifica se o accessToken expirou
        isTokenExpired: () => {
          const { tokens } = get();
          if (!tokens) return true;
          return Date.now() >= tokens.expiresAt;
        },
      }),
      {
        name: 'auth-storage', // chave no localStorage
        // Persiste apenas dados não sensíveis (tokens ficam em memória)
        partialize: (state) => ({ user: state.user, status: state.status }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
