import React, { useState, useRef } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Hook customizado para copiar para clipboard com feedback
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const useClipboard = (timeout = 2000) => {
  const [copied, setCopied] = useState<string | boolean>(false);
  const timeoutRef = useRef<any>(null);

  const copy = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para navegadores antigos
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(text);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), timeout);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  return { copied, copy };
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tema (cores do StreamHub)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const G = {
  bg: "#08080a",
  surface: "#111114",
  card: "#17171b",
  border: "#2a2a32",
  text: "#e8e8f0",
  muted: "#7a7a8c",
  accent: "#00e5b0",
  live: "#ff3b3b",
  success: "#00d084",
  warning: "#ffb900",
  font: "'Syne', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface RtmpKeyFieldProps {
  label: string;
  value: string;
  type?: "url" | "key";
  icon?: React.ReactNode;
  showCopyFeedback?: boolean;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Componente: Campo de chave copiável individual
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function RtmpKeyField({
  label,
  value,
  type = "url", // 'url' ou 'key'
  icon,
}: RtmpKeyFieldProps) {
  const { copied, copy } = useClipboard();
  const [visible, setVisible] = useState(type === "url"); // URL visível por padrão, key oculta
  const inputRef = useRef<HTMLInputElement>(null);

  const isPassword = !visible && type === "key";
  const displayValue = isPassword ? "●".repeat(Math.min(value.length, 32)) : value;
  const color = type === "key" ? G.live : G.accent;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Label */}
      <label
        style={{
          fontSize: 11,
          color: G.muted,
          fontWeight: 600,
          display: "block",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: G.font,
        }}
      >
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {label}
      </label>

      {/* Input + Buttons */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "stretch",
          background: G.bg,
          borderRadius: 10,
          border: `0.5px solid ${G.border}`,
          overflow: "hidden",
          transition: "border-color .2s, box-shadow .2s",
        }}
      >
        {/* Campo de input (read-only) */}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          readOnly
          style={{
            flex: 1,
            padding: "12px 14px",
            background: "transparent",
            border: "none",
            color: color,
            fontFamily: G.mono,
            fontSize: 13,
            fontWeight: 500,
            outline: "none",
            userSelect: "all",
            letterSpacing: isPassword ? "0.3em" : "normal",
          }}
        />

        {/* Botão: Mostrar/Ocultar (apenas para keys) */}
        {type === "key" && (
          <button
            onClick={() => setVisible(!visible)}
            style={{
              padding: "0 12px",
              background: "transparent",
              border: "none",
              color: visible ? color : G.muted,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color .2s",
              fontFamily: G.font,
            }}
            title={visible ? "Ocultar" : "Mostrar"}
          >
            {visible ? "👁" : "🔒"}
          </button>
        )}

        {/* Botão: Copiar */}
        <button
          onClick={() => copy(value)}
          style={{
            padding: "0 14px",
            background: copied ? G.success : color,
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 12,
            transition: "background .2s, transform .1s",
            fontFamily: G.font,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            userSelect: "none",
          }}
        >
          {copied ? (
            <>
              <span>✓</span> Copiado
            </>
          ) : (
            <>
              <span>📋</span> Copiar
            </>
          )}
        </button>
      </div>

      {/* Dica de uso */}
      <div style={{ fontSize: 10, color: G.muted, marginTop: 6, fontFamily: G.mono }}>
        {type === "url" && "Cole em: Settings → Stream → Server"}
        {type === "key" && "Cole em: Settings → Stream → Stream Key"}
      </div>
    </div>
  );
}

interface RtmpPlatformCardProps {
  platform: string;
  connected?: boolean;
  loading?: boolean;
  error?: string | null;
  rtmpUrl?: string;
  streamKey?: string;
  channelName?: string;
  onFetchKey?: () => void;
  onDisconnect?: () => void;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Componente: Card completo de uma plataforma
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function RtmpPlatformCard({
  platform,
  connected = false,
  loading = false,
  error = null,
  rtmpUrl = "",
  streamKey = "",
  channelName = "",
  onFetchKey = undefined,
  onDisconnect = undefined,
}: RtmpPlatformCardProps) {
  const [expanded, setExpanded] = useState(false);

  const PLATFORMS: Record<string, { label: string; color: string; icon: string }> = {
    youtube: { label: "YouTube", color: "#FF0000", icon: "▶" },
    twitch: { label: "Twitch", color: "#9146FF", icon: "⬡" },
    kick: { label: "Kick", color: "#53FC18", icon: "◆" },
    tiktok: { label: "TikTok", color: "#EE1D52", icon: "♪" },
    facebook: { label: "Facebook", color: "#1877F2", icon: "f" },
  };

  const p = PLATFORMS[platform] || { label: platform, color: G.muted, icon: "◈" };
  const hasKey = rtmpUrl && streamKey;

  return (
    <div
      style={{
        background: G.card,
        border: `0.5px solid ${connected ? p.color + "66" : G.border}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "all .3s ease",
        boxShadow: expanded ? `0 8px 24px ${p.color}22` : "none",
      }}
    >
      {/* Header (clickável) */}
      <div
        onClick={() => hasKey && setExpanded(!expanded)}
        style={{
          padding: 16,
          background: expanded ? p.color + "08" : "transparent",
          borderBottom: expanded ? `0.5px solid ${p.color}22` : "none",
          cursor: hasKey ? "pointer" : "default",
          transition: "all .2s",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Ícone da plataforma */}
        <span
          style={{
            fontSize: 28,
            color: p.color,
            minWidth: 40,
            textAlign: "center",
          }}
        >
          {p.icon}
        </span>

        {/* Informações */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: G.text }}>
            {p.label}
          </div>
          {channelName && (
            <div
              style={{
                fontSize: 12,
                color: G.muted,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📺 {channelName}
            </div>
          )}
        </div>

        {/* Status badge */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 6,
            background: connected ? p.color + "22" : G.border,
            color: connected ? p.color : G.muted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
            fontFamily: G.font,
          }}
        >
          {loading ? "⏳ Carregando..." : connected ? "✓ Ativa" : "✗ Inativa"}
        </div>

        {/* Chevron (expandir) */}
        {hasKey && (
          <span
            style={{
              color: G.muted,
              fontSize: 16,
              transition: "transform .3s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        )}
      </div>

      {/* Conteúdo expansível */}
      {hasKey && expanded && (
        <div style={{ padding: 16, background: G.surface, borderTop: `0.5px solid ${G.border}` }}>
          <RtmpKeyField
            label="RTMP Server"
            value={rtmpUrl}
            type="url"
            icon="🎥"
          />
          <RtmpKeyField label="Stream Key" value={streamKey} type="key" icon="🔑" />

          {/* Exemplos de uso */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `0.5px solid ${G.border}` }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: G.text,
                marginBottom: 10,
                fontFamily: G.font,
              }}
            >
              💡 Como usar:
            </div>
            <div style={{ fontSize: 11, color: G.muted, lineHeight: 1.6, fontFamily: G.mono }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: G.accent }}>OBS Studio:</span>
                <br />
                Settings → Stream → Custom RTMP → Cole o Server e Key acima
              </div>
              <div>
                <span style={{ color: G.accent }}>FFmpeg:</span>
                <br />
                ffmpeg -i input.mp4 -f flv "{rtmpUrl}{rtmpUrl.endsWith("/") ? "" : "/"}{streamKey}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div
          style={{
            padding: 12,
            background: G.live + "15",
            borderTop: `0.5px solid ${G.live}55`,
            fontSize: 12,
            color: G.live,
            fontFamily: G.font,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Botões de ação */}
      {!hasKey && connected && !error && (
        <div
          style={{
            padding: 12,
            background: G.surface,
            borderTop: `0.5px solid ${G.border}`,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={onFetchKey}
            disabled={loading}
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: 8,
              background: p.color,
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: G.font,
              transition: "opacity .2s",
            }}
          >
            {loading ? "⏳ Gerando..." : "🔓 Gerar Chave"}
          </button>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "transparent",
                border: `0.5px solid ${G.border}`,
                color: G.muted,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: G.font,
              }}
            >
              🔌 Desconectar
            </button>
          )}
        </div>
      )}

      {/* Estado desconectado */}
      {!connected && !loading && (
        <div
          style={{
            padding: 12,
            background: G.surface,
            borderTop: `0.5px solid ${G.border}`,
            fontSize: 12,
            color: G.muted,
            textAlign: "center",
            fontFamily: G.font,
          }}
        >
          Conecte sua conta {p.label} para usar RTMP
        </div>
      )}
    </div>
  );
}

interface RtmpKeyQuickProps {
  rtmpUrl: string;
  streamKey: string;
  platform?: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Componente: Display rápido da chave (inline, compacto)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function RtmpKeyQuick({ rtmpUrl, streamKey }: RtmpKeyQuickProps) {
  const { copied, copy } = useClipboard();
  const [showKey, setShowKey] = useState(false);

  if (!rtmpUrl || !streamKey) {
    return (
      <div style={{ padding: 12, textAlign: "center", color: G.muted, fontSize: 12 }}>
        Nenhuma chave RTMP disponível
      </div>
    );
  }

  return (
    <div
      style={{
        background: G.card,
        border: `0.5px solid ${G.border}`,
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
      }}
    >
      {/* RTMP URL */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: G.muted, marginBottom: 4, fontSize: 10 }}>Server:</div>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            padding: 8,
            background: G.bg,
            borderRadius: 6,
            borderLeft: `2px solid ${G.accent}`,
          }}
        >
          <code
            style={{
              flex: 1,
              fontFamily: G.mono,
              fontSize: 11,
              color: G.accent,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={rtmpUrl}
          >
            {rtmpUrl}
          </code>
          <button
            onClick={() => copy(rtmpUrl)}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              background: G.accent,
              color: G.bg,
              border: "none",
              fontWeight: 600,
              fontSize: 10,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied === rtmpUrl ? "✓" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Stream Key */}
      <div>
        <div style={{ color: G.muted, marginBottom: 4, fontSize: 10 }}>Chave:</div>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            padding: 8,
            background: G.bg,
            borderRadius: 6,
            borderLeft: `2px solid ${G.live}`,
          }}
        >
          <code
            style={{
              flex: 1,
              fontFamily: G.mono,
              fontSize: 11,
              color: G.live,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: showKey ? "normal" : "0.2em",
            }}
          >
            {showKey ? streamKey : "●".repeat(Math.min(streamKey.length, 24))}
          </code>
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              padding: "4px 6px",
              borderRadius: 4,
              background: "transparent",
              color: G.muted,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              transition: "color .2s",
            }}
          >
            {showKey ? "🔒" : "👁"}
          </button>
          <button
            onClick={() => copy(streamKey)}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              background: G.live,
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 10,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied === streamKey ? "✓" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RtmpGridProps {
  platforms: Array<{
    id: string;
    connected: boolean;
    loading: boolean;
    error: string | null;
    rtmp_url?: string;
    stream_key?: string;
    channel_name?: string;
  }>;
  onFetchKey?: (platformId: string) => void;
  onDisconnect?: (platformId: string) => void;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Componente: Grid de múltiplas plataformas
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function RtmpGrid({ platforms = [], onFetchKey, onDisconnect }: RtmpGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: 12,
      }}
    >
      {platforms.map((p) => (
        <RtmpPlatformCard
          key={p.id}
          platform={p.id}
          connected={p.connected}
          loading={p.loading}
          error={p.error}
          rtmpUrl={p.rtmp_url}
          streamKey={p.stream_key}
          channelName={p.channel_name}
          onFetchKey={() => onFetchKey?.(p.id)}
          onDisconnect={() => onDisconnect?.(p.id)}
        />
      ))}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CSS global
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const RtmpStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  
  /* Animação de cópia */
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  button {
    user-select: none;
  }

  code {
    word-break: break-all;
  }
`;

export default RtmpPlatformCard;
