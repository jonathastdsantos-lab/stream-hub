/**
 * @file stream.store.ts
 * @description Store para gerenciar streaming de respostas (SSE / WebSocket).
 * Controla o buffer de chunks, status da conexão e cancelamento.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type StreamStatus =
  | 'idle'        // Nenhum stream ativo
  | 'connecting'  // Abrindo conexão
  | 'streaming'   // Recebendo dados
  | 'done'        // Stream concluído com sucesso
  | 'error'       // Falha durante o stream
  | 'cancelled';  // Cancelado pelo usuário

export interface StreamChunk {
  id: string;
  content: string;
  /** Delta incremental do chunk (para streaming token-by-token) */
  delta: string;
  timestamp: number;
}

export interface StreamState {
  // --- Estado ---
  status: StreamStatus;
  /** Todos os chunks recebidos no stream atual */
  chunks: StreamChunk[];
  /** Texto acumulado de todos os chunks */
  accumulatedText: string;
  /** ID da mensagem sendo streamada */
  activeMessageId: string | null;
  error: string | null;
  /** Referência ao AbortController para cancelar fetch/SSE */
  abortController: AbortController | null;

  // --- Ações ---
  startStream: (messageId: string) => AbortController;
  appendChunk: (chunk: Omit<StreamChunk, 'id' | 'timestamp'>) => void;
  completeStream: () => void;
  cancelStream: () => void;
  setError: (error: string) => void;
  reset: () => void;

  // --- Seletores computados ---
  isStreaming: () => boolean;
  getFullText: () => string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let chunkCounter = 0;

export const useStreamStore = create<StreamState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      status: 'idle',
      chunks: [],
      accumulatedText: '',
      activeMessageId: null,
      error: null,
      abortController: null,

      /**
       * Inicia um novo stream para uma mensagem.
       * Retorna o AbortController para uso externo (ex: fetch).
       */
      startStream: (messageId) => {
        const controller = new AbortController();
        chunkCounter = 0;

        set(
          {
            status: 'connecting',
            chunks: [],
            accumulatedText: '',
            activeMessageId: messageId,
            error: null,
            abortController: controller,
          },
          false,
          'stream/start',
        );

        return controller;
      },

      /**
       * Adiciona um chunk ao buffer e atualiza o texto acumulado.
       */
      appendChunk: ({ content, delta }) => {
        const chunk: StreamChunk = {
          id: `chunk-${++chunkCounter}`,
          content,
          delta,
          timestamp: Date.now(),
        };

        set(
          (state) => ({
            status: 'streaming',
            chunks: [...state.chunks, chunk],
            accumulatedText: state.accumulatedText + delta,
          }),
          false,
          'stream/appendChunk',
        );
      },

      /**
       * Marca o stream como concluído e libera recursos.
       */
      completeStream: () =>
        set(
          { status: 'done', abortController: null },
          false,
          'stream/complete',
        ),

      /**
       * Cancela o stream em andamento via AbortController.
       */
      cancelStream: () => {
        const { abortController } = get();
        abortController?.abort();

        set(
          { status: 'cancelled', abortController: null },
          false,
          'stream/cancel',
        );
      },

      /**
       * Define erro e interrompe o stream.
       */
      setError: (error) =>
        set(
          { status: 'error', error, abortController: null },
          false,
          'stream/error',
        ),

      /**
       * Reseta completamente o store para o estado inicial.
       */
      reset: () =>
        set(
          {
            status: 'idle',
            chunks: [],
            accumulatedText: '',
            activeMessageId: null,
            error: null,
            abortController: null,
          },
          false,
          'stream/reset',
        ),

      // Verifica se há um stream ativo
      isStreaming: () => {
        const { status } = get();
        return status === 'connecting' || status === 'streaming';
      },

      // Retorna o texto completo acumulado
      getFullText: () => get().accumulatedText,
    }),
    { name: 'StreamStore' },
  ),
);
