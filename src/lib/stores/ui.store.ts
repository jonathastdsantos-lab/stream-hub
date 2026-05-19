/**
 * @file ui.store.ts
 * @description Store de estado de interface — controla temas, painéis,
 * modais, notificações toast e preferências visuais do usuário.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';

export type SidebarPosition = 'left' | 'right';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** Duração em ms. 0 = persistente até fechar manualmente */
  duration: number;
  createdAt: number;
}

export interface ModalState {
  isOpen: boolean;
  /** Identificador do modal ativo (ex: 'settings', 'confirm-delete') */
  activeModal: string | null;
  /** Dados arbitrários passados ao modal */
  modalProps: Record<string, unknown>;
}

export interface UIState {
  // --- Tema ---
  theme: Theme;
  /** Tema resolvido após considerar preferência do sistema */
  resolvedTheme: 'light' | 'dark';

  // --- Layout ---
  sidebarOpen: boolean;
  sidebarPosition: SidebarPosition;
  sidebarWidth: number; // px
  /** Modo compacto oculta labels e reduz padding */
  compactMode: boolean;

  // --- Modal ---
  modal: ModalState;

  // --- Toasts ---
  toasts: Toast[];

  // --- Input ---
  /** Valor atual do campo de texto principal */
  inputValue: string;
  /** Indica se o input está focado */
  inputFocused: boolean;

  // --- Ações: Tema ---
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;

  // --- Ações: Layout ---
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarPosition: (position: SidebarPosition) => void;
  setSidebarWidth: (width: number) => void;
  toggleCompactMode: () => void;

  // --- Ações: Modal ---
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;

  // --- Ações: Toasts ---
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // --- Ações: Input ---
  setInputValue: (value: string) => void;
  setInputFocused: (focused: boolean) => void;
  clearInput: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let toastCounter = 0;

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        theme: 'system',
        resolvedTheme: 'dark',
        sidebarOpen: true,
        sidebarPosition: 'left',
        sidebarWidth: 260,
        compactMode: false,
        modal: { isOpen: false, activeModal: null, modalProps: {} },
        toasts: [],
        inputValue: '',
        inputFocused: false,

        // ---------------------------------------------------------------
        // Tema
        // ---------------------------------------------------------------

        /** Altera a preferência de tema do usuário */
        setTheme: (theme) => set({ theme }, false, 'ui/setTheme'),

        /** Define o tema resolvido após checar a preferência do OS */
        setResolvedTheme: (resolvedTheme) =>
          set({ resolvedTheme }, false, 'ui/setResolvedTheme'),

        // ---------------------------------------------------------------
        // Layout
        // ---------------------------------------------------------------

        /** Alterna a visibilidade da sidebar */
        toggleSidebar: () =>
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            'ui/toggleSidebar',
          ),

        /** Define diretamente se a sidebar está aberta */
        setSidebarOpen: (sidebarOpen) =>
          set({ sidebarOpen }, false, 'ui/setSidebarOpen'),

        /** Muda a posição da sidebar (esquerda/direita) */
        setSidebarPosition: (sidebarPosition) =>
          set({ sidebarPosition }, false, 'ui/setSidebarPosition'),

        /** Ajusta a largura da sidebar (respeitando min 180px / max 480px) */
        setSidebarWidth: (width) =>
          set(
            { sidebarWidth: Math.min(480, Math.max(180, width)) },
            false,
            'ui/setSidebarWidth',
          ),

        /** Alterna o modo compacto de exibição */
        toggleCompactMode: () =>
          set(
            (state) => ({ compactMode: !state.compactMode }),
            false,
            'ui/toggleCompactMode',
          ),

        // ---------------------------------------------------------------
        // Modal
        // ---------------------------------------------------------------

        /**
         * Abre um modal pelo ID e opcionalmente passa props.
         * Exemplo: openModal('confirm-delete', { itemId: '123' })
         */
        openModal: (modalId, props = {}) =>
          set(
            { modal: { isOpen: true, activeModal: modalId, modalProps: props } },
            false,
            'ui/openModal',
          ),

        /** Fecha o modal ativo */
        closeModal: () =>
          set(
            { modal: { isOpen: false, activeModal: null, modalProps: {} } },
            false,
            'ui/closeModal',
          ),

        // ---------------------------------------------------------------
        // Toasts
        // ---------------------------------------------------------------

        /**
         * Exibe uma notificação toast e retorna seu ID.
         * Toasts com duration > 0 são auto-removidos externamente
         * (use um hook com setTimeout que chama removeToast).
         */
        addToast: ({ title, description, variant = 'info', duration = 4000 }) => {
          const id = `toast-${++toastCounter}`;
          const toast: Toast = { id, title, description, variant, duration, createdAt: Date.now() };

          set(
            (state) => ({ toasts: [...state.toasts, toast] }),
            false,
            'ui/addToast',
          );

          // Auto-remoção após `duration` ms (0 = persistente)
          if (duration > 0) {
            setTimeout(() => get().removeToast(id), duration);
          }

          return id;
        },

        /** Remove um toast pelo ID */
        removeToast: (id) =>
          set(
            (state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }),
            false,
            'ui/removeToast',
          ),

        /** Remove todos os toasts */
        clearToasts: () => set({ toasts: [] }, false, 'ui/clearToasts'),

        // ---------------------------------------------------------------
        // Input
        // ---------------------------------------------------------------

        /** Atualiza o valor do campo de input principal */
        setInputValue: (inputValue) =>
          set({ inputValue }, false, 'ui/setInputValue'),

        /** Marca o estado de foco do input */
        setInputFocused: (inputFocused) =>
          set({ inputFocused }, false, 'ui/setInputFocused'),

        /** Limpa o input */
        clearInput: () => set({ inputValue: '' }, false, 'ui/clearInput'),
      }),
      {
        name: 'ui-storage',
        // Persiste apenas preferências do usuário, não estado efêmero
        partialize: (state) => ({
          theme: state.theme,
          sidebarPosition: state.sidebarPosition,
          sidebarWidth: state.sidebarWidth,
          compactMode: state.compactMode,
        }),
      },
    ),
    { name: 'UIStore' },
  ),
);
