import React from "react";
import { G, PLATFORMS, PlatformId } from "./constants";

const Tag = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      padding: "3px 8px",
      borderRadius: 6,
      background: `${color}14`,
      border: `0.5px solid ${color}33`,
      color: color,
      display: "inline-block",
    }}
  >
    {children}
  </span>
);

interface PlatformsTabProps {
  connected: Record<PlatformId, boolean>;
  platformDetails: Record<PlatformId, any>;
  togglePlatform: (platform: PlatformId) => void;
}

export function PlatformsTab({
  connected,
  platformDetails,
  togglePlatform,
}: PlatformsTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Plataformas e Destinos de Transmissão
        </h1>
        <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
          Adicione ou remova canais de streaming. A transmissão simultânea enviará seu sinal para todas as plataformas ativadas.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PLATFORMS.map((p) => {
          const isConn = connected[p.id];
          const details = platformDetails[p.id];
          
          return (
            <div
              key={p.id}
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 20,
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${p.color}14`,
                  border: `1px solid ${p.color}44`,
                  color: p.color,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                {p.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{p.label}</p>
                  <Tag color={isConn ? G.accent : G.muted}>
                    {isConn ? "Ativo" : "Inativo"}
                  </Tag>
                </div>
                <p style={{ color: G.muted, fontSize: 12, marginTop: 4 }}>
                  {isConn 
                    ? `Canal: ${details?.channel_name || "Conectado"} • Chave: ${details?.stream_key?.substring(0, 10)}...`
                    : "Plataforma inativa. Clique em Conectar para ativar a transmissão para este destino."
                  }
                </p>
              </div>
              <button
                onClick={() => togglePlatform(p.id)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: `1px solid ${isConn ? G.live + "66" : G.accent + "66"}`,
                  background: "transparent",
                  color: isConn ? G.live : G.accent,
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: G.font,
                  transition: "all .2s",
                }}
              >
                {isConn ? "Desconectar" : "Conectar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
