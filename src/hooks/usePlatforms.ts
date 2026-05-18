import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PlatformId } from "../lib/stores/chat.store";
import { toast } from "sonner";

export function usePlatforms(userId?: string, displayName?: string, email?: string) {
  const [connected, setConnected] = useState<Record<PlatformId, boolean>>({
    youtube: false,
    twitch: false,
    kick: false,
    tiktok: false,
    facebook: false,
  });
  const [platformDetails, setPlatformDetails] = useState<Record<PlatformId, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function loadData() {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data: conns, error: connErr } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("user_id", userId);

      if (!connErr && conns) {
        const connState: Record<PlatformId, boolean> = {
          youtube: false,
          twitch: false,
          kick: false,
          tiktok: false,
          facebook: false,
        };
        const details: Record<PlatformId, any> = {};

        conns.forEach((conn: any) => {
          if (conn.platform in connState) {
            connState[conn.platform as PlatformId] = conn.is_active;
            details[conn.platform as PlatformId] = conn;
          }
        });

        setConnected(connState);
        setPlatformDetails(details);
      }
    } catch (e: any) {
      console.error("Error loading connections: ", e.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const togglePlatform = async (platform: PlatformId) => {
    if (!userId) return;
    const isCurrentlyConnected = connected[platform];

    try {
      if (isCurrentlyConnected) {
        if (platform === "youtube") {
          const confirmDisconnect = window.confirm(
            "Tem certeza de que deseja desconectar a sua conta do YouTube?"
          );
          if (!confirmDisconnect) return;
        }

        const { error } = await supabase
          .from("platform_connections")
          .delete()
          .eq("user_id", userId)
          .eq("platform", platform);

        if (error) throw error;

        setConnected((c) => ({ ...c, [platform]: false }));
        setPlatformDetails((prev) => {
          const updated = { ...prev };
          delete updated[platform];
          return updated;
        });
        toast.success(`Plataforma ${platform.toUpperCase()} desconectada!`);
      } else {
        if (platform === "youtube") {
          toast.loading("Redirecionando para autenticação do Google...");
          const redirectUri = window.location.origin + "/auth/youtube/callback";
          const { getGoogleOAuthUrl } = await import("../lib/oauth");
          window.location.href = getGoogleOAuthUrl(redirectUri);
          return;
        }

        const dummyKey = `live_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 10)}`;
        const dummyRtmp = `rtmp://rtmp.${platform}.com/live2`;
        const channelName = `${displayName || email?.split("@")[0] || "Streamer"} Live`;

        const { error, data } = await supabase
          .from("platform_connections")
          .insert({
            user_id: userId,
            platform: platform,
            stream_key: dummyKey,
            rtmp_url: dummyRtmp,
            channel_name: channelName,
            channel_id: `ch_${Math.random().toString(36).substring(2, 8)}`,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        setConnected((c) => ({ ...c, [platform]: true }));
        setPlatformDetails((prev) => ({ ...prev, [platform]: data }));
        toast.success(`Plataforma ${platform.toUpperCase()} conectada!`);
      }
    } catch (e: any) {
      toast.error(e.message || `Erro ao alterar conexão da plataforma ${platform}`);
    }
  };

  const reconnectPlatform = async (platform: PlatformId) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      if (platform === "youtube") {
        toast.loading("Redirecionando para re-autenticação do YouTube...");
        const redirectUri = window.location.origin + "/auth/youtube/callback";
        const { getGoogleOAuthUrl } = await import("../lib/oauth");
        window.location.href = getGoogleOAuthUrl(redirectUri);
        return;
      }

      // Twitch, Kick, TikTok, Facebook: Simulate connection credentials renewal
      await new Promise((r) => setTimeout(r, 1200));

      const dummyKey = `live_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 10)}`;
      const dummyRtmp = `rtmp://rtmp.${platform}.com/live2`;
      const channelName = `${displayName || email?.split("@")[0] || "Streamer"} Live`;

      const { error, data } = await supabase
        .from("platform_connections")
        .upsert({
          user_id: userId,
          platform: platform,
          stream_key: dummyKey,
          rtmp_url: dummyRtmp,
          channel_name: channelName,
          channel_id: `ch_${Math.random().toString(36).substring(2, 8)}`,
          is_active: true,
          connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,platform" })
        .select()
        .single();

      if (error) throw error;

      setConnected((c) => ({ ...c, [platform]: true }));
      setPlatformDetails((prev) => ({ ...prev, [platform]: data }));
      toast.success(`Plataforma ${platform.toUpperCase()} reconectada com sucesso!`);
    } catch (e: any) {
      toast.error(e.message || `Erro ao reconectar a plataforma ${platform}`);
    } finally {
      setIsLoading(false);
    }
  };

  const connectionsList = Object.keys(connected).map((platformKey) => {
    const details = platformDetails[platformKey as PlatformId];
    return {
      id: details?.id || platformKey,
      platform: platformKey,
      channel_name: details?.channel_name || `${displayName || email?.split("@")[0] || "Streamer"} Live`,
      is_active: connected[platformKey as PlatformId],
      rtmp_url: details?.rtmp_url,
      stream_key: details?.stream_key,
      connected_at: details?.connected_at,
    };
  });

  return {
    connected,
    platformDetails,
    connectionsList,
    togglePlatform,
    reconnectPlatform,
    refreshPlatforms: loadData,
    isLoading,
  };
}
