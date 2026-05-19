/**
 * @file chat.store.ts
 * @description Store principal do chat — gerencia conversas, mensagens,
 * histórico e estado de envio.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'streaming' | 'error';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
  /** Metadados opcionais (ex: tokens usados, modelo) */
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  /** ID do modelo/plataforma utilizado */
  platformId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  /** Indica se a conversa está arquivada */
  archived: boolean;
}

export interface ChatState {
  // --- Estado ---
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;

  // --- Ações: Conversas ---
  createConversation: (platformId: string, title?: string) => string;
  setActiveConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  archiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // --- Ações: Mensagens ---
  addMessage: (conversationId: string, message: Omit<Message, 'conversationId'>) => void;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void;
  appendToMessage: (conversationId: string, messageId: string, delta: string) => void;

  // --- Ações: UI ---
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // --- Seletores computados ---
  getActiveConversation: () => Conversation | null;
  getConversationMessages: (id: string) => Message[];
  getConversationList: () => Conversation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        conversations: {},
        activeConversationId: null,
        isLoading: false,
        error: null,

        // ---------------------------------------------------------------
        // Conversas
        // ---------------------------------------------------------------

        /**
         * Cria uma nova conversa e a define como ativa.
         * Retorna o ID da nova conversa.
         */
        createConversation: (platformId, title = 'Nova conversa') => {
          const id = generateId();
          const conversation: Conversation = {
            id,
            title,
            platformId,
            messages: [],
            createdAt: now(),
            updatedAt: now(),
            archived: false,
          };

          set(
            (state) => ({
              conversations: { ...state.conversations, [id]: conversation },
              activeConversationId: id,
            }),
            false,
            'chat/createConversation',
          );

          return id;
        },

        /** Define qual conversa está ativa no momento */
        setActiveConversation: (id) =>
          set({ activeConversationId: id }, false, 'chat/setActive'),

        /** Renomeia uma conversa */
        updateConversationTitle: (id, title) =>
          set(
            (state) => ({
              conversations: {
                ...state.conversations,
                [id]: { ...state.conversations[id], title, updatedAt: now() },
              },
            }),
            false,
            'chat/renameConversation',
          ),

        /** Arquiva (oculta) uma conversa sem deletá-la */
        archiveConversation: (id) =>
          set(
            (state) => ({
              conversations: {
                ...state.conversations,
                [id]: { ...state.conversations[id], archived: true, updatedAt: now() },
              },
            }),
            false,
            'chat/archiveConversation',
          ),

        /** Remove permanentemente uma conversa */
        deleteConversation: (id) => {
          set(
            (state) => {
              const { [id]: _removed, ...rest } = state.conversations;
              return {
                conversations: rest,
                activeConversationId:
                  state.activeConversationId === id ? null : state.activeConversationId,
              };
            },
            false,
            'chat/deleteConversation',
          );
        },

        // ---------------------------------------------------------------
        // Mensagens
        // ---------------------------------------------------------------

        /**
         * Adiciona uma mensagem a uma conversa específica.
         */
        addMessage: (conversationId, message) =>
          set(
            (state) => {
              const conv = state.conversations[conversationId];
              if (!conv) return state;

              const fullMessage: Message = { ...message, conversationId };
              return {
                conversations: {
                  ...state.conversations,
                  [conversationId]: {
                    ...conv,
                    messages: [...conv.messages, fullMessage],
                    updatedAt: now(),
                  },
                },
              };
            },
            false,
            'chat/addMessage',
          ),

        /**
         * Atualiza campos de uma mensagem existente (ex: status, content).
         */
        updateMessage: (conversationId, messageId, patch) =>
          set(
            (state) => {
              const conv = state.conversations[conversationId];
              if (!conv) return state;

              return {
                conversations: {
                  ...state.conversations,
                  [conversationId]: {
                    ...conv,
                    messages: conv.messages.map((m) =>
                      m.id === messageId ? { ...m, ...patch } : m,
                    ),
                    updatedAt: now(),
                  },
                },
              };
            },
            false,
            'chat/updateMessage',
          ),

        /**
         * Acrescenta texto incremental (delta) ao conteúdo de uma mensagem.
         * Usado durante streaming token-by-token.
         */
        appendToMessage: (conversationId, messageId, delta) =>
          set(
            (state) => {
              const conv = state.conversations[conversationId];
              if (!conv) return state;

              return {
                conversations: {
                  ...state.conversations,
                  [conversationId]: {
                    ...conv,
                    messages: conv.messages.map((m) =>
                      m.id === messageId ? { ...m, content: m.content + delta } : m,
                    ),
                  },
                },
              };
            },
            false,
            'chat/appendToMessage',
          ),

        // ---------------------------------------------------------------
        // UI
        // ---------------------------------------------------------------

        setLoading: (isLoading) => set({ isLoading }, false, 'chat/setLoading'),

        setError: (error) => set({ error }, false, 'chat/setError'),

        // ---------------------------------------------------------------
        // Seletores
        // ---------------------------------------------------------------

        /** Retorna a conversa ativa ou null */
        getActiveConversation: () => {
          const { conversations, activeConversationId } = get();
          return activeConversationId ? (conversations[activeConversationId] ?? null) : null;
        },

        /** Retorna mensagens de uma conversa específica */
        getConversationMessages: (id) => get().conversations[id]?.messages ?? [],

        /** Lista conversas não arquivadas, ordenadas pela mais recente */
        getConversationList: () =>
          Object.values(get().conversations)
            .filter((c) => !c.archived)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      }),
      {
        name: 'chat-storage',
        // Persiste apenas conversas (evita manter estado de UI)
        partialize: (state) => ({ conversations: state.conversations }),
      },
    ),
    { name: 'ChatStore' },
  ),
);
