import { useState, useEffect, useCallback, useRef } from 'react';

interface ViewerDataPoint {
  timestamp: Date;
  viewers: number;
  platform: string;
}

interface PlatformStats {
  platformId: string;
  platformName: string;
  viewers: number;
  peakViewers: number;
  chatMessages: number;
  newFollowers: number;
  donations: number;
  donationAmount: number;
}

interface StreamAnalytics {
  streamId: string;
  startedAt: Date;
  duration: number;
  totalViewers: number;
  peakViewers: number;
  averageViewers: number;
  totalChatMessages: number;
  newFollowers: number;
  totalDonations: number;
  totalDonationAmount: number;
  viewerHistory: ViewerDataPoint[];
  platformStats: PlatformStats[];
  engagementRate: number;
  retentionRate: number;
}

interface HistoricalStream {
  id: string;
  title: string;
  startedAt: Date;
  duration: number;
  peakViewers: number;
  totalViewers: number;
  totalDonationAmount: number;
  platforms: string[];
}

interface AnalyticsState {
  currentStream: StreamAnalytics | null;
  historicalStreams: HistoricalStream[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  realtimeEnabled: boolean;
}

export function useAnalytics(streamId?: string) {
  const [state, setState] = useState<AnalyticsState>({
    currentStream: null,
    historicalStreams: [],
    isLoading: false,
    isLoadingHistory: false,
    error: null,
    realtimeEnabled: false,
  });

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCurrentAnalytics = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/analytics/streams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();

      setState(prev => ({
        ...prev,
        currentStream: {
          ...data,
          startedAt: new Date(data.startedAt),
          viewerHistory: data.viewerHistory.map((v: ViewerDataPoint & { timestamp: string }) => ({
            ...v,
            timestamp: new Date(v.timestamp),
          })),
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
      setState(prev => ({ ...prev, error: message }));
    }
  }, []);

  const startRealtime = useCallback((id: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    setState(prev => ({ ...prev, realtimeEnabled: true }));
    fetchCurrentAnalytics(id);
    pollingIntervalRef.current = setInterval(() => fetchCurrentAnalytics(id), 10000);
  }, [fetchCurrentAnalytics]);

  const stopRealtime = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    setState(prev => ({ ...prev, realtimeEnabled: false }));
  }, []);

  const fetchHistory = useCallback(async (limit = 20, offset = 0) => {
    setState(prev => ({ ...prev, isLoadingHistory: true }));
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/analytics/history?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setState(prev => ({
        ...prev,
        isLoadingHistory: false,
        historicalStreams: data.streams.map((s: HistoricalStream & { startedAt: string }) => ({
          ...s,
          startedAt: new Date(s.startedAt),
        })),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch history';
      setState(prev => ({ ...prev, isLoadingHistory: false, error: message }));
    }
  }, []);

  const getStreamReport = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/analytics/streams/${id}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to generate report');
      return await res.json();
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to generate report' };
    }
  }, []);

  const getTopMoments = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/analytics/streams/${id}/moments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch moments');
      return await res.json();
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch moments' };
    }
  }, []);

  const getAggregatedStats = useCallback(() => {
    const streams = state.historicalStreams;
    if (!streams.length) return null;

    return {
      totalStreams: streams.length,
      totalDuration: streams.reduce((sum, s) => sum + s.duration, 0),
      averagePeakViewers: Math.round(streams.reduce((sum, s) => sum + s.peakViewers, 0) / streams.length),
      totalEarnings: streams.reduce((sum, s) => sum + s.totalDonationAmount, 0),
      bestStream: streams.reduce((best, s) => s.peakViewers > best.peakViewers ? s : best, streams[0]),
    };
  }, [state.historicalStreams]);

  useEffect(() => {
    if (streamId) {
      startRealtime(streamId);
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [streamId, startRealtime]);

  const viewerTrend = state.currentStream?.viewerHistory.slice(-20) ?? [];
  const aggregatedStats = getAggregatedStats();

  return {
    ...state,
    viewerTrend,
    aggregatedStats,
    startRealtime,
    stopRealtime,
    fetchHistory,
    getStreamReport,
    getTopMoments,
    fetchCurrentAnalytics,
  };
}
