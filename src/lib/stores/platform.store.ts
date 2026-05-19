/**
 * @file platform.store.ts
 * @description Store de plataformas/modelos de IA disponíveis.
 * Gerencia quais providers estão configurados, qual está ativo,
 * e as configurações de cada um (ex: temperatura, max_tokens).
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PlatformProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'ollama'
  | 'custom';

export interface ModelConfig {
  /** Identificador interno do modelo (ex: "gpt-4o") */
  id: string;
  /** Nome amigável exibido na UI */
  label: string;
  /** Contexto máximo em tokens */
  contextWindow: number;
  /** Suporta visão (imagens)? */
  supportsVision: boolean;
  /** Suporta function calling? */
  supportsFunctions: boolean;
}

export interface PlatformSettings {
  /** Temperatura (0.0 – 2.0) */
  temperature: number;
  /** Máximo de tokens na resposta */
  maxTokens: number;
  /** Top-p sampling */
  topP: number;
  /** System prompt padrão para esta plataforma */
  systemPrompt: string;
  /** Habilita streaming de respostas */
  streamEnabled: boolean;
}

export interface Platform {
  id: string;
  name: string;
  provider: PlatformProvider;
  /** Modelo atualmente selecionado */
  activeModelId: string;
  /** Lista de modelos disponíveis nesta plataforma */
  models: ModelConfig[];
  settings: PlatformSettings;
  /** Se a plataforma está habilitada/configurada com API key */
  enabled: boolean;
  /** URL base para providers custom/Ollama */
  baseUrl?: string;
}

export interface PlatformState {
  // --- Estado ---
  platforms: Record<string, Platform>;
  activePlatformId: string | null;

  // --- Ações ---
  addPlatform: (platform: Platform) => void;
  removePlatform: (id: string) => void;
  setActivePlatform: (id: string) => void;
  updateSettings: (platformId: string, settings: Partial<PlatformSettings>) => void;
  setActiveModel: (platformId: string, modelId: string) => void;
  togglePlatform: (id: string, enabled: boolean) => void;

  // --- Seletores computados ---
  getActivePlatform: () => Platform | null;
  getActiveModel: () => ModelConfig | null;
  getEnabledPlatforms: () => Platform[];
}

// ---------------------------------------------------------------------------
// Configurações padrão
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: PlatformSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  systemPrompt: '',
  streamEnabled: true,
};

/** Plataformas pré-configuradas na inicialização */
const INITIAL_PLATFORMS: Record<string, Platform> = {
  'openai-default': {
    id: 'openai-default',
    name: 'OpenAI',
    provider: 'openai',
    activeModelId: 'gpt-4o',
    models: [
      {
        id: 'gpt-4o',
        label: 'GPT-4o',
        contextWindow: 128000,
        supportsVision: true,
        supportsFunctions: true,
      },
      {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        contextWindow: 128000,
        supportsVision: true,
        supportsFunctions: true,
      },
      {
        id: 'gpt-3.5-turbo',
        label: 'GPT-3.5 Turbo',
        contextWindow: 16385,
        supportsVision: false,
        supportsFunctions: true,
      },
    ],
    settings: { ...DEFAULT_SETTINGS },
    enabled: false,
  },
  'anthropic-default': {
    id: 'anthropic-default',
    name: 'Anthropic',
    provider: 'anthropic',
    activeModelId: 'claude-3-5-sonnet-20241022',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        label: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        supportsVision: true,
        supportsFunctions: true,
      },
      {
        id: 'claude-3-haiku-20240307',
        label: 'Claude 3 Haiku',
        contextWindow: 200000,
        supportsVision: true,
        supportsFunctions: true,
      },
    ],
    settings: { ...DEFAULT_SETTINGS },
    enabled: false,
  },
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePlatformStore = create<PlatformState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial com plataformas pré-definidas
        platforms: INITIAL_PLATFORMS,
        activePlatformId: null,

        /** Registra uma nova plataforma (ex: Ollama local ou custom) */
        addPlatform: (platform) =>
          set(
            (state) => ({ platforms: { ...state.platforms, [platform.id]: platform } }),
            false,
            'platform/add',
          ),

        /** Remove uma plataforma pelo ID */
        removePlatform: (id) =>
          set(
            (state) => {
              const { [id]: _removed, ...rest } = state.platforms;
              return {
                platforms: rest,
                activePlatformId: state.activePlatformId === id ? null : state.activePlatformId,
              };
            },
            false,
            'platform/remove',
          ),

        /** Define a plataforma ativa */
        setActivePlatform: (id) =>
          set({ activePlatformId: id }, false, 'platform/setActive'),

        /** Atualiza configurações parciais de uma plataforma */
        updateSettings: (platformId, settings) =>
          set(
            (state) => {
              const platform = state.platforms[platformId];
              if (!platform) return state;

              return {
                platforms: {
                  ...state.platforms,
                  [platformId]: {
                    ...platform,
                    settings: { ...platform.settings, ...settings },
                  },
                },
              };
            },
            false,
            'platform/updateSettings',
          ),

        /** Troca o modelo ativo de uma plataforma */
        setActiveModel: (platformId, modelId) =>
          set(
            (state) => {
              const platform = state.platforms[platformId];
              if (!platform) return state;

              return {
                platforms: {
                  ...state.platforms,
                  [platformId]: { ...platform, activeModelId: modelId },
                },
              };
            },
            false,
            'platform/setActiveModel',
          ),

        /** Habilita ou desabilita uma plataforma */
        togglePlatform: (id, enabled) =>
          set(
            (state) => ({
              platforms: {
                ...state.platforms,
                [id]: { ...state.platforms[id], enabled },
              },
            }),
            false,
            'platform/toggle',
          ),

        /** Retorna a plataforma ativa ou null */
        getActivePlatform: () => {
          const { platforms, activePlatformId } = get();
          return activePlatformId ? (platforms[activePlatformId] ?? null) : null;
        },

        /** Retorna o modelo ativo da plataforma ativa */
        getActiveModel: () => {
          const platform = get().getActivePlatform();
          if (!platform) return null;
          return platform.models.find((m) => m.id === platform.activeModelId) ?? null;
        },

        /** Lista apenas plataformas habilitadas */
        getEnabledPlatforms: () =>
          Object.values(get().platforms).filter((p) => p.enabled),
      }),
      {
        name: 'platform-storage',
        // Persiste plataformas e ID ativo (não persiste estado volátil)
        partialize: (state) => ({
          platforms: state.platforms,
          activePlatformId: state.activePlatformId,
        }),
      },
    ),
    { name: 'PlatformStore' },
  ),
);
