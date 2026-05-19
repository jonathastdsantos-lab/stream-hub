import { useState, useEffect, useRef, useCallback } from 'react';

export type StreamStatus = 'idle' | 'connecting' | 'live' | 'paused' | 'ended' | 'error';

interface StreamConfig {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPrivate?: boolean;
}

interface StreamStats {
  viewers: number;
  peakViewers: number;
  duration: number;
  bitrate: number;
  fps: number;
  resolution: string;
  droppedFrames: number;
}

interface StreamState {
  status: StreamStatus;
  streamId: string | null;
  streamKey: string | null;
  rtmpUrl: string | null;
  config: StreamConfig | null;
  stats: StreamStats;
  error: string | null;
  startedAt: Date | null;
}

const DEFAULT_STATS: StreamStats = {
  viewers: 0,
  peakViewers: 0,
  duration: 0,
  bitrate: 0,
  fps: 0,
  resolution: '1920x1080',
  droppedFrames: 0,
};

export function useStream() {
  const [state, setState] = useState<StreamState>({
    status: 'idle',
    streamId: null,
    streamKey: null,
    rtmpUrl: null,
    config: null,
    stats: DEFAULT_STATS,
    error: null,
    startedAt: null,
  });

  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async (streamId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/streams/${streamId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const stats = await res.json();
        setState(prev => ({
          ...prev,
          stats: { ...prev.stats, ...stats },
        }));
      }
    } catch {
      // silent fail for stats
    }
  }, []);

  const startStream = useCallback(async (config: StreamConfig) => {
    setState(prev => ({ ...prev, status: 'connecting', error: null }));
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/streams/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to start stream');
      }
      const { streamId, streamKey, rtmpUrl } = await res.json();
      const startedAt = new Date();

      setState(prev => ({
        ...prev,
        status: 'live',
        streamId,
        streamKey,
        rtmpUrl,
        config,
        startedAt,
        stats: DEFAULT_STATS,
      }));

      statsIntervalRef.current = setInterval(() => fetchStats(streamId), 5000);
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            duration: Math.floor((Date.now() - startedAt.getTime()) / 1000),
          },
        }));
      }, 1000);

      return { success: true, streamId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start stream';
      setState(prev => ({ ...prev, status: 'error', error: message }));
      return { success: false, error: message };
    }
  }, [fetchStats]);

  const endStream = useCallback(async () => {
    const { streamId } = state;
    if (!streamId) return;

    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/streams/${streamId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // proceed regardless
    }

    setState(prev => ({
      ...prev,
      status: 'ended',
      streamKey: null,
      rtmpUrl: null,
    }));
  }, [state]);

  const pauseStream = useCallback(async () => {
    const { streamId } = state;
    if (!streamId) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/streams/${streamId}/pause`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setState(prev => ({ ...prev, status: 'paused' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pause';
      setState(prev => ({ ...prev, error: message }));
    }
  }, [state]);

  const resumeStream = useCallback(async () => {
    const { streamId } = state;
    if (!streamId) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/streams/${streamId}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setState(prev => ({ ...prev, status: 'live' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resume';
      setState(prev => ({ ...prev, error: message }));
    }
  }, [state]);

  const updateConfig = useCallback((updates: Partial<StreamConfig>) => {
    setState(prev => ({
      ...prev,
      config: prev.config ? { ...prev.config, ...updates } : null,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  const isLive = state.status === 'live';
  const isPaused = state.status === 'paused';
  const isConnecting = state.status === 'connecting';

  return {
    ...state,
    isLive,
    isPaused,
    isConnecting,
    startStream,
    endStream,
    pauseStream,
    resumeStream,
    updateConfig,
  };
}
