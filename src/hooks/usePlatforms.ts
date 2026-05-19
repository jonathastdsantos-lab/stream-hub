import { useState, useCallback } from 'react';

export type PlatformId = 'youtube' | 'twitch' | 'facebook' | 'tiktok' | 'instagram' | 'custom' | 'kick';

export interface Platform {
  id: PlatformId;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
  isEnabled: boolean;
  streamKey?: string;
  rtmpUrl?: string;
  channelId?: string;
  channelName?: string;
  viewers?: number;
  status: 'idle' | 'live' | 'error';
  error?: string;
}

interface PlatformsState {
  platforms: Platform[];
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_PLATFORMS: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    isConnected: false,
    isEnabled: false,
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
    status: 'idle',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: 'twitch',
    color: '#9146FF',
    isConnected: false,
    isEnabled: false,
    rtmpUrl: 'rtmp://live.twitch.tv/live',
    status: 'idle',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    isConnected: false,
    isEnabled: false,
    rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp',
    status: 'idle',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'tiktok',
    color: '#010101',
    isConnected: false,
    isEnabled: false,
    rtmpUrl: 'rtmp://push.tiktokcdn.com/live',
    status: 'idle',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    isConnected: false,
    isEnabled: false,
    rtmpUrl: 'rtmps://edgetee-upload-prn3-1.xx.fbcdn.net:443/rtmp',
    status: 'idle',
  },
  {
    id: 'kick',
    name: 'Kick',
    icon: 'kick',
    color: '#53FC18',
    isConnected: false,
    isEnabled: false,
    rtmpUrl: 'rtmps://stream.kick.com/app',
    status: 'idle',
  },
];

export function usePlatforms() {
  const [state, setState] = useState<PlatformsState>({
    platforms: DEFAULT_PLATFORMS,
    isLoading: false,
    error: null,
  });

  const loadPlatforms = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/platforms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load platforms');
      const data = await res.json();
      setState(prev => ({
        ...prev,
        isLoading: false,
        platforms: prev.platforms.map(p => {
          const saved = data.platforms?.find((s: Platform) => s.id === p.id);
          return saved ? { ...p, ...saved } : p;
        }),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load platforms';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const connectPlatform = useCallback(async (platformId: PlatformId, authCode?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/platforms/${platformId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ authCode }),
      });
      if (!res.ok) throw new Error('Failed to connect platform');
      const data = await res.json();
      setState(prev => ({
        ...prev,
        isLoading: false,
        platforms: prev.platforms.map(p =>
          p.id === platformId ? { ...p, ...data, isConnected: true } : p
        ),
      }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      setState(prev => ({
        ...prev,
        isLoading: false,
        platforms: prev.platforms.map(p =>
          p.id === platformId ? { ...p, error: message } : p
        ),
      }));
      return { success: false, error: message };
    }
  }, []);

  const disconnectPlatform = useCallback(async (platformId: PlatformId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/platforms/${platformId}/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // proceed regardless
    }
    setState(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p.id === platformId
          ? { ...p, isConnected: false, isEnabled: false, streamKey: undefined, channelId: undefined }
          : p
      ),
    }));
  }, []);

  const togglePlatform = useCallback((platformId: PlatformId, enabled: boolean) => {
    setState(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p.id === platformId ? { ...p, isEnabled: enabled } : p
      ),
    }));
  }, []);

  const updateStreamKey = useCallback((platformId: PlatformId, streamKey: string) => {
    setState(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p.id === platformId ? { ...p, streamKey } : p
      ),
    }));
  }, []);

  const addCustomPlatform = useCallback((config: {
    name: string;
    rtmpUrl: string;
    streamKey: string;
  }) => {
    const customPlatform: Platform = {
      id: 'custom',
      name: config.name,
      icon: 'server',
      color: '#6B7280',
      isConnected: true,
      isEnabled: true,
      rtmpUrl: config.rtmpUrl,
      streamKey: config.streamKey,
      status: 'idle',
    };
    setState(prev => ({
      ...prev,
      platforms: [...prev.platforms.filter(p => p.id !== 'custom'), customPlatform],
    }));
  }, []);

  const updatePlatformStatus = useCallback((
    platformId: PlatformId,
    status: Platform['status'],
    error?: string
  ) => {
    setState(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p.id === platformId ? { ...p, status, error } : p
      ),
    }));
  }, []);

  const connectedPlatforms = state.platforms.filter(p => p.isConnected);
  const enabledPlatforms = state.platforms.filter(p => p.isEnabled && p.isConnected);
  const livePlatforms = state.platforms.filter(p => p.status === 'live');
  const totalViewers = state.platforms.reduce((sum, p) => sum + (p.viewers || 0), 0);

  return {
    ...state,
    connectedPlatforms,
    enabledPlatforms,
    livePlatforms,
    totalViewers,
    loadPlatforms,
    connectPlatform,
    disconnectPlatform,
    togglePlatform,
    updateStreamKey,
    addCustomPlatform,
    updatePlatformStatus,
  };
}
