import { useState, useRef, useCallback } from 'react';

export type RtmpStatus = 'idle' | 'connecting' | 'connected' | 'streaming' | 'error' | 'disconnected';

interface RtmpDestination {
  id: string;
  platformId: string;
  rtmpUrl: string;
  streamKey: string;
  status: RtmpStatus;
  bitrate: number;
  droppedFrames: number;
  error?: string;
}

interface RtmpState {
  destinations: RtmpDestination[];
  isMultistreaming: boolean;
  globalBitrate: number;
  globalFps: number;
  encoder: 'h264' | 'h265' | 'vp9';
  resolution: '720p' | '1080p' | '1440p' | '4k';
  audioBitrate: number;
  audioSampleRate: 44100 | 48000;
  keyframeInterval: number;
  isLoading: boolean;
  error: string | null;
}

interface RtmpConfig {
  bitrate?: number;
  fps?: number;
  encoder?: RtmpState['encoder'];
  resolution?: RtmpState['resolution'];
  audioBitrate?: number;
  audioSampleRate?: RtmpState['audioSampleRate'];
  keyframeInterval?: number;
}

export function useRtmp() {
  const [state, setState] = useState<RtmpState>({
    destinations: [],
    isMultistreaming: false,
    globalBitrate: 6000,
    globalFps: 60,
    encoder: 'h264',
    resolution: '1080p',
    audioBitrate: 160,
    audioSampleRate: 48000,
    keyframeInterval: 2,
    isLoading: false,
    error: null,
  });

  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addDestination = useCallback((destination: Omit<RtmpDestination, 'status' | 'bitrate' | 'droppedFrames'>) => {
    setState(prev => ({
      ...prev,
      destinations: [
        ...prev.destinations,
        { ...destination, status: 'idle', bitrate: 0, droppedFrames: 0 },
      ],
      isMultistreaming: prev.destinations.length >= 1,
    }));
  }, []);

  const removeDestination = useCallback((destinationId: string) => {
    setState(prev => ({
      ...prev,
      destinations: prev.destinations.filter(d => d.id !== destinationId),
      isMultistreaming: prev.destinations.length > 2,
    }));
  }, []);

  const connectDestination = useCallback(async (destinationId: string) => {
    setState(prev => ({
      ...prev,
      destinations: prev.destinations.map(d =>
        d.id === destinationId ? { ...d, status: 'connecting' } : d
      ),
    }));

    try {
      const token = localStorage.getItem('auth_token');
      const destination = state.destinations.find(d => d.id === destinationId);
      if (!destination) throw new Error('Destination not found');

      const res = await fetch('/api/rtmp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinationId,
          rtmpUrl: destination.rtmpUrl,
          streamKey: destination.streamKey,
        }),
      });

      if (!res.ok) throw new Error('RTMP connection failed');

      setState(prev => ({
        ...prev,
        destinations: prev.destinations.map(d =>
          d.id === destinationId ? { ...d, status: 'connected' } : d
        ),
      }));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        destinations: prev.destinations.map(d =>
          d.id === destinationId ? { ...d, status: 'error', error: message } : d
        ),
      }));
      return { success: false, error: message };
    }
  }, [state.destinations]);

  const startAllStreams = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/rtmp/start-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinations: state.destinations.filter(d => d.status !== 'error'),
          config: {
            bitrate: state.globalBitrate,
            fps: state.globalFps,
            encoder: state.encoder,
            resolution: state.resolution,
            audioBitrate: state.audioBitrate,
            audioSampleRate: state.audioSampleRate,
            keyframeInterval: state.keyframeInterval,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to start streams');

      setState(prev => ({
        ...prev,
        isLoading: false,
        destinations: prev.destinations.map(d => ({ ...d, status: 'streaming' })),
      }));

      statsIntervalRef.current = setInterval(async () => {
        try {
          const statsRes = await fetch('/api/rtmp/stats', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (statsRes.ok) {
            const stats = await statsRes.json();
            setState(prev => ({
              ...prev,
              destinations: prev.destinations.map(d => {
                const s = stats[d.id];
                return s ? { ...d, bitrate: s.bitrate, droppedFrames: s.droppedFrames } : d;
              }),
            }));
          }
        } catch {
          // silent
        }
      }, 3000);

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, [state]);

  const stopAllStreams = useCallback(async () => {
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/rtmp/stop-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // proceed regardless
    }
    setState(prev => ({
      ...prev,
      destinations: prev.destinations.map(d => ({ ...d, status: 'disconnected', bitrate: 0 })),
    }));
  }, []);

  const updateConfig = useCallback((config: RtmpConfig) => {
    setState(prev => ({ ...prev, ...config }));
  }, []);

  const updateDestinationKey = useCallback((destinationId: string, streamKey: string) => {
    setState(prev => ({
      ...prev,
      destinations: prev.destinations.map(d =>
        d.id === destinationId ? { ...d, streamKey } : d
      ),
    }));
  }, []);

  const testConnection = useCallback(async (destinationId: string) => {
    const destination = state.destinations.find(d => d.id === destinationId);
    if (!destination) return { success: false, error: 'Destination not found' };

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/rtmp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rtmpUrl: destination.rtmpUrl, streamKey: destination.streamKey }),
      });
      const data = await res.json();
      return { success: res.ok, latency: data.latency, error: data.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Test failed' };
    }
  }, [state.destinations]);

  const activeDestinations = state.destinations.filter(d => d.status === 'streaming');
  const errorDestinations = state.destinations.filter(d => d.status === 'error');
  const totalBitrate = state.destinations.reduce((sum, d) => sum + d.bitrate, 0);

  return {
    ...state,
    activeDestinations,
    errorDestinations,
    totalBitrate,
    addDestination,
    removeDestination,
    connectDestination,
    startAllStreams,
    stopAllStreams,
    updateConfig,
    updateDestinationKey,
    testConnection,
  };
}
