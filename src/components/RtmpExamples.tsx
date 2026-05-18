import React, { useState, useEffect } from "react";
import {
  RtmpPlatformCard,
  RtmpKeyField,
  RtmpKeyQuick,
  RtmpGrid,
  RtmpStyles,
} from "./RtmpKeyDisplay";

interface RtmpManagementPageProps {
  userId: string;
  supabase: any;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Exemplo 1: Página completa de gerenciamento de chaves RTMP
 * ─────────────────────────────────────────────────────────────────────────
 */
export function RtmpManagementPage({ userId, supabase }: RtmpManagementPageProps) {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Buscar plataformas conectadas
  useEffect(() => {
    const fetchPlatforms = async () => {
      const { data } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("user_id", userId);

      if (data) {
        setPlatforms(
          data.map((p: any) => ({
            id: p.platform,
            connected: p.is_active,
            rtmp_url: p.rtmp_url,
            stream_key: p.stream_key,
            channel_name: p.channel_name,
            channel_id: p.channel_id,
            error: null,
            loading: false,
          }))
        );
      }
    };

    fetchPlatforms();
  }, [userId, supabase]);

  // Buscar chave RTMP via Edge Function
  const fetchRtmpKey = async (platformId: string) => {
    setLoading((l) => ({ ...l, [platformId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("get-rtmp-key", {
        body: { userId, platform: platformId },
      });

      if (error) throw error;

      // Atualizar estado local
      setPlatforms((p) =>
        p.map((pf) =>
          pf.id === platformId
            ? {
                ...pf,
                rtmp_url: data.rtmp_url,
                stream_key: data.stream_key,
                error: null,
              }
            : pf
        )
      );

      // Atualizar banco
      await supabase
        .from("platform_connections")
        .update({
          rtmp_url: data.rtmp_url,
          stream_key: data.stream_key,
        })
        .eq("user_id", userId)
        .eq("platform", platformId);
    } catch (err: any) {
      setPlatforms((p) =>
        p.map((pf) =>
          pf.id === platformId
            ? { ...pf, error: err.message || "Erro ao buscar chave" }
            : pf
        )
      );
    } finally {
      setLoading((l) => ({ ...l, [platformId]: false }));
    }
  };

  // Desconectar plataforma
  const disconnectPlatform = async (platformId: string) => {
    if (confirm(`Desconectar ${platformId}?`)) {
      await supabase
        .from("platform_connections")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("platform", platformId);

      setPlatforms((p) =>
        p.map((pf) =>
          pf.id === platformId ? { ...pf, connected: false } : pf
        )
      );
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
      <style>{RtmpStyles}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          Gerenciar Chaves RTMP
        </h1>
        <p style={{ fontSize: 14, color: "#7a7a8c" }}>
          Conecte suas contas de streaming e obtenha as chaves RTMP para usar em OBS, FFmpeg ou
          outros encoders.
        </p>
      </div>

      {/* Grid de plataformas */}
      <RtmpGrid
        platforms={platforms.map((p) => ({
          ...p,
          loading: loading[p.id] || false,
        }))}
        onFetchKey={fetchRtmpKey}
        onDisconnect={disconnectPlatform}
      />
    </div>
  );
}

interface RtmpQuickPreviewProps {
  platform: {
    name: string;
    rtmp_url?: string;
    stream_key?: string;
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Exemplo 2: Card compacto para uma plataforma (no Dashboard principal)
 * ─────────────────────────────────────────────────────────────────────────
 */
export function RtmpQuickPreview({ platform }: RtmpQuickPreviewProps) {
  return (
    <div
      style={{
        background: "#17171b",
        border: "0.5px solid #2a2a32",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
        {platform.name} RTMP
      </div>

      {platform.rtmp_url && platform.stream_key ? (
        <RtmpKeyQuick rtmpUrl={platform.rtmp_url} streamKey={platform.stream_key} />
      ) : (
        <div style={{ fontSize: 12, color: "#7a7a8c", textAlign: "center", padding: "20px" }}>
          Nenhuma chave gerada ainda. Vá para Plataformas para gerar.
        </div>
      )}
    </div>
  );
}

interface ConnectPlatformModalProps {
  platform: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  onClose: () => void;
  onConnected?: () => void;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Exemplo 3: Modal de conexão de plataforma (com OAuth flow)
 * ─────────────────────────────────────────────────────────────────────────
 */
export function ConnectPlatformModal({ platform, onClose }: ConnectPlatformModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);

    try {
      switch (platform.id) {
        case "youtube":
          window.location.href = getYoutubeOAuthUrl();
          break;
        case "twitch":
          window.location.href = getTwitchOAuthUrl();
          break;
        default:
          alert("Fluxo OAuth não configurado para esta plataforma.");
          setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao conectar:", err);
      alert("Erro ao conectar plataforma");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#17171b",
          border: "0.5px solid #2a2a32",
          borderRadius: 12,
          padding: 28,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 48, marginBottom: 16, display: "block" }}>
          {platform.icon}
        </span>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Conectar {platform.name}
        </h2>

        <p style={{ fontSize: 13, color: "#7a7a8c", marginBottom: 20, lineHeight: 1.5 }}>
          Você será redirecionado para o site da {platform.name} para autorizar o acesso.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              border: "0.5px solid #2a2a32",
              background: "transparent",
              color: "#7a7a8c",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px",
              background: platform.color,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Conectando..." : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LivePanelRtmpProps {
  connections: Array<{
    platform: string;
    is_active: boolean;
    rtmp_url?: string;
    stream_key: string;
  }>;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Exemplo 4: Exibir no painel "Ao vivo" com campo para cópia rápida
 * ─────────────────────────────────────────────────────────────────────────
 */
export function LivePanelRtmp({ connections }: LivePanelRtmpProps) {
  const activeConnections = connections.filter((c) => c.is_active && c.rtmp_url);

  return (
    <div
      style={{
        background: "#17171b",
        border: "0.5px solid #2a2a32",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
        Transmissões ativas: {activeConnections.length}
      </h3>

      {activeConnections.length === 0 ? (
        <div style={{ color: "#7a7a8c", fontSize: 12, textAlign: "center", padding: "20px" }}>
          Nenhuma plataforma conectada. Configure as chaves RTMP para começar a transmitir.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activeConnections.map((c) => (
            <div
              key={c.platform}
              style={{
                padding: 10,
                background: "#111114",
                borderRadius: 6,
                border: `0.5px solid #2a2a32`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 600, color: "#e8e8f0" }}>
                {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(c.stream_key);
                  alert("Chave copiada!");
                }}
                style={{
                  padding: "4px 12px",
                  background: "#00e5b0",
                  color: "#08080a",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Copiar Chave
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Helpers para URLs de OAuth (implementar de acordo com sua config)
 * ─────────────────────────────────────────────────────────────────────────
 */
function getYoutubeOAuthUrl() {
  const params = new URLSearchParams({
    client_id: "YOUTUBE_CLIENT_ID_PLACEHOLDER",
    redirect_uri: `${window.location.origin}/auth/youtube/callback`,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function getTwitchOAuthUrl() {
  const params = new URLSearchParams({
    client_id: "TWITCH_CLIENT_ID_PLACEHOLDER",
    redirect_uri: `${window.location.origin}/auth/twitch/callback`,
    response_type: "code",
    scope: "user:read:email channel:manage:broadcast",
  });
  return `https://id.twitch.tv/oauth2/authorize?${params}`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Exemplo 5: Componente de teste (rápido para debugar)
 * ─────────────────────────────────────────────────────────────────────────
 */
export function RtmpTestComponent() {
  const [rtmpUrl, setRtmpUrl] = useState("rtmps://a.rtmp.youtube.com/a/");
  const [streamKey, setStreamKey] = useState("abcd-efgh-ijkl-mnop");

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <style>{RtmpStyles}</style>

      <h2 style={{ marginBottom: 20 }}>Teste de Componentes RTMP</h2>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 12 }}>Entrada simulada:</h3>
        <input
          value={rtmpUrl}
          onChange={(e) => setRtmpUrl(e.target.value)}
          placeholder="URL RTMP"
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: 8,
            borderRadius: 6,
            border: "0.5px solid #2a2a32",
            background: "#111114",
            color: "#e8e8f0",
            fontFamily: "'JetBrains Mono'",
            fontSize: 12,
          }}
        />
        <input
          value={streamKey}
          onChange={(e) => setStreamKey(e.target.value)}
          placeholder="Stream Key"
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 6,
            border: "0.5px solid #2a2a32",
            background: "#111114",
            color: "#e8e8f0",
            fontFamily: "'JetBrains Mono'",
            fontSize: 12,
          }}
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 12 }}>RtmpKeyField:</h3>
        <RtmpKeyField label="RTMP URL" value={rtmpUrl} type="url" icon="🎥" />
        <RtmpKeyField label="Stream Key" value={streamKey} type="key" icon="🔑" />
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 12 }}>RtmpKeyQuick:</h3>
        <RtmpKeyQuick rtmpUrl={rtmpUrl} streamKey={streamKey} />
      </div>

      <div>
        <h3 style={{ marginBottom: 12 }}>RtmpPlatformCard:</h3>
        <RtmpPlatformCard
          platform="youtube"
          connected={true}
          rtmpUrl={rtmpUrl}
          streamKey={streamKey}
          channelName="Meu Canal 🎬"
        />
      </div>
    </div>
  );
}

export default RtmpManagementPage;
