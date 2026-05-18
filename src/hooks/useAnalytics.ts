import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export interface AnalyticsMetrics {
  viewerCount: number;
  peakViewers: number;
  messagesPerSec: number;
  avgChatters: number;
  followersToday: number;
}

export function useAnalytics(streamId?: string) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    viewerCount: 0,
    peakViewers: 0,
    messagesPerSec: 0,
    avgChatters: 0,
    followersToday: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!streamId) return;

    setIsLoading(true);
    // Fetch initial stream stats from supabase
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from("streams")
          .select("*")
          .eq("id", streamId)
          .maybeSingle();

        if (data) {
          setMetrics((prev) => ({
            ...prev,
            viewerCount: data.viewer_count || 0,
            peakViewers: Math.max(prev.peakViewers, data.viewer_count || 0),
          }));
        }
      } catch (err) {
        console.error("[useAnalytics] Initial fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();

    // Subscribe to realtime streams updates to stay completely synced
    const channel = supabase
      .channel(`analytics_stream_${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "streams",
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated) {
            setMetrics((prev) => ({
              ...prev,
              viewerCount: updated.viewer_count || 0,
              peakViewers: Math.max(prev.peakViewers, updated.viewer_count || 0),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  function calculateEngagement(): number {
    if (metrics.viewerCount === 0) return 0;
    // Heuristics: messages per second relative to total viewer count
    const base = (metrics.messagesPerSec * 100) / metrics.viewerCount;
    return Math.min(Math.round(base * 10) / 10, 100);
  }

  function exportAnalytics(format: "csv" | "json") {
    const dataStr = JSON.stringify(metrics, null, 2);
    if (format === "json") {
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `streamhub_analytics_${streamId || "export"}.json`;
      link.click();
      toast.success("Estatísticas exportadas em JSON! 📊");
    } else {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Viewer Count,Peak Viewers,Messages/Sec,Avg Chatters,Followers Today\n"
        + `${metrics.viewerCount},${metrics.peakViewers},${metrics.messagesPerSec},${metrics.avgChatters},${metrics.followersToday}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `streamhub_analytics_${streamId || "export"}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Estatísticas exportadas em CSV! 📊");
    }
  }

  return {
    metrics,
    isLoading,
    calculateEngagement,
    exportAnalytics,
  };
}
