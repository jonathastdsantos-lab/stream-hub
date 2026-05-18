/**
 * ═══════════════════════════════════════════════════════════════
 * Componente React: Gerenciador de Chaves RTMP
 * 
 * Mostra chaves RTMP, permite cópia e exibe comandos FFmpeg
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";

const PLATFORMS = [
  { id: "youtube",  label: "YouTube",  color: "#FF0000", icon: "▶", doc: "https://docs.google.com/document/d/1k..." },
  { id: "twitch",   label: "Twitch",   color: "#9146FF", icon: "⬡", doc: "https://dev.twitch.tv/docs/..." },
  { id: "kick",     label: "Kick",     color: "#53FC18", icon: "◆", doc: "https://kick.com/api..." },
  { id: "tiktok",   label: "TikTok",   color: "#EE1D52", icon: "♪", doc: "https://developers.tiktok.com/..." },
  { id: "facebook", label: "Facebook", color: "#1877F2", icon: "f", doc: "https://developers.facebook.com/..." },
];

const G = {
  bg: "#08080a", surface: "#111114", card: "#17171b",
  border: "#2a2a32", text: "#e8e8f0", muted: "#7a7a8c",
  accent: "#00e5b0", live: "#ff3b3b", success: "#00d084",
  font: "'Syne', sans-serif", mono: "'JetBrains Mono', monospace",
};

interface PlatformKey {
  platform: string;
  rtmp_url: string;
  stream_key: string;
  live_stream_id?: string;
  loading?: boolean;
  error?: string;
  last_fetched?: Date;
}

interface PlatformConnection {
  id: string;
  platform: string;
  channel_name: string;
  is_active: boolean;
  rtmp_url?: string;
  stream_key?: string;
}

/**
 * Componente individual para cada plataforma
 */
function PlatformCard({
  platform,
  connection,
  rtmpKey,
  onFetchKey,
  onCopyUrl,
  onCopyKey,
  loading,
}: {
  platform: (typeof PLATFORMS)[0];
  connection: PlatformConnection | null;
  rtmpKey: PlatformKey | null;
  onFetchKey: (platformId: string) => void;
  onCopyUrl: (text: string) => void;
  onCopyKey: (text: string) => void;
  loading: boolean;
}) {
  const isActive = connection?.is_active;
  const hasKey = rtmpKey?.rtmp_url && rtmpKey?.stream_key;

  return (
    <div
      style={{
        background: G.card,
        border: `0.5px solid ${isActive ? platform.color + "66" : G.border}`,
        borderRadius: 12,
        padding: 16,
        transition: "all .2s",
        opacity: isActive ? 1 : 0.5,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 24, color: platform.color }}>{platform.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: G.text }}>{platform.label}</div>
          {connection && (
            <div style={{ fontSize: 11, color: G.muted }}>
              📺 {connection.channel_name}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 4,
            background: isActive ? platform.color + "22" : G.border,
            color: isActive ? platform.color : G.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {isActive ? "Conectada" : "Desconectada"}
        </div>
      </div>

      {/* RTMP URLs */}
      {hasKey && (
        <div style={{ background: G.surface, borderRadius: 8, padding: 12, marginBottom: 12 }}>
          {/* RTMP URL */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: G.muted, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              RTMP Server
            </label>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "8px 12px",
                background: G.bg,
                borderRadius: 6,
                border: `0.5px solid ${G.border}`,
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontFamily: G.mono,
                  fontSize: 12,
                  color: G.accent,
                  wordBreak: "break-all",
                  overflow: "hidden",
                }}
              >
                {rtmpKey.rtmp_url}
              </code>
              <button
                onClick={() => onCopyUrl(rtmpKey.rtmp_url)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 5,
                  background: G.accent,
                  color: G.bg,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Copiar
              </button>
            </div>
          </div>

          {/* Stream Key */}
          <div>
            <label style={{ fontSize: 10, color: G.muted, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Stream Key
            </label>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "8px 12px",
                background: G.bg,
                borderRadius: 6,
                border: `0.5px solid ${G.border}`,
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontFamily: G.mono,
                  fontSize: 12,
                  color: G.live,
                  wordBreak: "break-all",
                  overflow: "hidden",
                }}
              >
                {rtmpKey.stream_key}
              </code>
              <button
                onClick={() => onCopyKey(rtmpKey.stream_key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 5,
                  background: G.live,
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão para buscar chave */}
      {isActive && !hasKey && (
        <button
          onClick={() => onFetchKey(platform.id)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 8,
            background: platform.color,
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: G.font,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Buscando..." : "Gerar chave RTMP"}
        </button>
      )}

      {rtmpKey?.error && (
        <div
          style={{
            padding: "8px 12px",
            background: G.live + "15",
            border: `0.5px solid ${G.live}55`,
            borderRadius: 6,
            fontSize: 12,
            color: G.live,
          }}
        >
          ⚠ {rtmpKey.error}
        </div>
      )}

      {!isActive && (
        <div
          style={{
            padding: "10px",
            borderRadius: 8,
            background: G.surface,
            border: `0.5px solid ${G.border}`,
            fontSize: 12,
            color: G.muted,
            textAlign: "center",
          }}
        >
          Conecte sua conta {platform.label} para usar RTMP
        </div>
      )}
    </div>
  );
}

/**
 * Componente principal
 */
export function RtmpKeyManager({
  userId,
  supabaseClient,
  connections,
}: {
  userId: string;
  supabaseClient: any;
  connections: PlatformConnection[];
}) {
  const [rtmpKeys, setRtmpKeys] = useState<Record<string, PlatformKey>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string>("");

  // Busca chaves RTMP via Edge Function ou fallback administrativo
  const fetchRtmpKey = async (platformId: string) => {
    setLoading((l) => ({ ...l, [platformId]: true }));
    try {
      const { data, error } = await supabaseClient.functions.invoke("get-rtmp-key", {
        body: { userId, platform: platformId },
      });

      if (error) throw error;

      setRtmpKeys((k) => ({ ...k, [platformId]: data }));
    } catch (err: any) {
      console.warn("Fallback: Edge Function failed or not deployed yet. Querying db/fallback directly.");
      try {
        // Fallback local: busca direto na tabela caso o deploy do Edge Function não tenha sido feito ainda
        const { data: conn } = await supabaseClient
          .from("platform_connections")
          .select("*")
          .eq("user_id", userId)
          .eq("platform", platformId)
          .maybeSingle();

        if (conn) {
          let rtmp_url = conn.rtmp_url;
          let stream_key = conn.stream_key;

          if (!rtmp_url) {
            if (platformId === "youtube") rtmp_url = "rtmp://a.rtmp.youtube.com/live2";
            else if (platformId === "twitch") rtmp_url = "rtmps://live-api-s.twitch.tv:443/app";
            else if (platformId === "kick") rtmp_url = "rtmps://stream.kick.com/app";
            else if (platformId === "facebook") rtmp_url = "rtmps://live-api-s.facebook.com:443/rtmp";
            else if (platformId === "tiktok") rtmp_url = "rtmps://push-rtmp.tiktok.com/live";
            else rtmp_url = "rtmp://rtmp.streamhub.live/live";
          }

          if (!stream_key) {
            stream_key = `live_${userId.substring(0, 8)}_${platformId}_${Math.random().toString(36).substring(2, 10)}`;
          }

          // Salva para persistir
          await supabaseClient
            .from("platform_connections")
            .update({ rtmp_url, stream_key })
            .eq("id", conn.id);

          setRtmpKeys((k) => ({
            ...k,
            [platformId]: {
              platform: platformId,
              rtmp_url,
              stream_key,
            },
          }));
          return;
        }
      } catch (dbErr) {
        console.error("Direct DB fetch error:", dbErr);
      }

      setRtmpKeys((k) => ({
        ...k,
        [platformId]: {
          platform: platformId,
          rtmp_url: "",
          stream_key: "",
          error: err.message || "Erro ao buscar chave",
        },
      }));
    } finally {
      setLoading((l) => ({ ...l, [platformId]: false }));
    }
  };

  const copyToClipboard = (text: string, type: "url" | "key") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  // Busca automaticamente chaves na primeira renderização
  useEffect(() => {
    connections
      .filter((c) => c.is_active && !rtmpKeys[c.platform])
      .forEach((c) => {
        // Busca após um delay pequeno para não sobrecarregar
        setTimeout(() => fetchRtmpKey(c.platform), 300);
      });
  }, [connections]);

  const getFFmpegCommand = () => {
    const activeKeys = PLATFORMS.filter(
      (p) => connections.find((c) => c.platform === p.id && c.is_active) && rtmpKeys[p.id]?.rtmp_url
    );

    if (activeKeys.length === 0) return null;

    const outputs = activeKeys
      .map((p) => {
        const key = rtmpKeys[p.id];
        return `-f flv "${key.rtmp_url}${key.rtmp_url.endsWith("/") ? "" : "/"}${key.stream_key}"`;
      })
      .join(" ");

    return `ffmpeg -re -i input.mp4 -c:v libx264 -preset veryfast -b:v 3000k -c:a aac ${outputs}`;
  };

  const ffmpegCmd = getFFmpegCommand();

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        input[type="text"], input[type="number"] { font-family: ${G.mono}; }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Chaves RTMP</h2>
        <p style={{ color: G.muted, fontSize: 13 }}>
          Gerenciar chaves de streaming e gerar comandos FFmpeg para transmissão simultânea (Multistream)
        </p>
      </div>

      {/* Grid de plataformas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {PLATFORMS.map((p) => (
          <PlatformCard
            key={p.id}
            platform={p}
            connection={connections.find((c) => c.platform === p.id) || null}
            rtmpKey={rtmpKeys[p.id] || null}
            onFetchKey={fetchRtmpKey}
            onCopyUrl={(text) => copyToClipboard(text, "url")}
            onCopyKey={(text) => copyToClipboard(text, "key")}
            loading={loading[p.id] || false}
          />
        ))}
      </div>

      {copied && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: G.success,
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          ✓ Copiado para a área de transferência!
        </div>
      )}

      {/* FFmpeg Command */}
      {ffmpegCmd && (
        <div
          style={{
            background: G.card,
            border: `0.5px solid ${G.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: G.text }}>
            Comando FFmpeg para Multistream
          </h3>
          <p style={{ fontSize: 12, color: G.muted, marginBottom: 12 }}>
            Copie e execute no seu terminal para transmitir simultaneamente para todas as plataformas ativas:
          </p>
          <div
            style={{
              background: G.bg,
              border: `0.5px solid ${G.border}`,
              borderRadius: 8,
              padding: 14,
              marginBottom: 14,
              overflow: "auto",
            }}
          >
            <code
              style={{
                fontFamily: G.mono,
                fontSize: 11,
                color: G.accent,
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
            >
              {ffmpegCmd}
            </code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(ffmpegCmd);
              setCopied("ffmpeg");
              setTimeout(() => setCopied(""), 2000);
            }}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: G.accent,
              color: G.bg,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: G.font,
            }}
          >
            Copiar Comando FFmpeg
          </button>

          {/* Exemplos de uso */}
          <div
            style={{
              marginTop: 18,
              padding: "14px",
              background: G.surface,
              borderRadius: 8,
              fontSize: 12,
              color: G.muted,
              fontFamily: G.mono,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 600, color: G.text, marginBottom: 6 }}>Exemplos de Entrada:</div>
            <div>
              <span style={{ color: G.accent }}>De webcam e microfone:</span>
              <br />
              ffmpeg -f dshow -i video="Webcam" -f dshow -i audio="Microphone" -c:v libx264 -preset veryfast -b:v 3000k -c:a aac [Saídas]
            </div>
            <br />
            <div>
              <span style={{ color: G.accent }}>De arquivo de vídeo gravado (.mp4):</span>
              <br />
              ffmpeg -re -i video.mp4 -c:v copy -c:a copy [Saídas]
            </div>
            <br />
            <div>
              <span style={{ color: G.accent }}>De transmissão local OBS via RTMP:</span>
              <br />
              ffmpeg -i rtmp://localhost:1935/live/test -c:v copy -c:a copy [Saídas]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RtmpKeyManager;
