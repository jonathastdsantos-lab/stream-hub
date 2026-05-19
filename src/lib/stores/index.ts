/**
 * @file index.ts
 * @description Barrel de exportação de todos os Zustand stores.
 *
 * Importe stores e tipos a partir deste arquivo:
 * @example
 * import { useAuthStore, useChatStore, type User } from '@/lib/stores';
 */

// ---------------------------------------------------------------------------
// Auth Store — sessão, usuário e tokens JWT
// ---------------------------------------------------------------------------
export {
  useAuthStore,
  type User,
  type AuthTokens,
  type AuthStatus,
  type AuthState,
} from './auth.store';

// ---------------------------------------------------------------------------
// Stream Store — controle de SSE / streaming token-by-token
// ---------------------------------------------------------------------------
export {
  useStreamStore,
  type StreamChunk,
  type StreamStatus,
  type StreamState,
} from './stream.store';

// ---------------------------------------------------------------------------
// Chat Store — conversas e mensagens
// ---------------------------------------------------------------------------
export {
  useChatStore,
  type Message,
  type MessageRole,
  type MessageStatus,
  type Conversation,
  type ChatState,
} from './chat.store';

// ---------------------------------------------------------------------------
// Platform Store — provedores de IA, modelos e configurações
// ---------------------------------------------------------------------------
export {
  usePlatformStore,
  type Platform,
  type PlatformProvider,
  type PlatformSettings,
  type ModelConfig,
  type PlatformState,
} from './platform.store';

// ---------------------------------------------------------------------------
// UI Store — tema, layout, modais e toasts
// ---------------------------------------------------------------------------
export {
  useUIStore,
  type Theme,
  type SidebarPosition,
  type Toast,
  type ToastVariant,
  type ModalState,
  type UIState,
} from './ui.store';
