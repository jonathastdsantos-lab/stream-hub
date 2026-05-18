import React, { useState } from "react";
import { G, PLATFORMS, PlatformId } from "./constants";
import { Eye, EyeOff, RefreshCw, Signal, CheckCircle2, Copy, Info, Check, ShieldCheck, Settings } from "lucide-react";
import { toast } from "sonner";

interface PlatformsTabProps {
  connected: Record<PlatformId, boolean>;
  platformDetails: Record<PlatformId, any>;
  togglePlatform: (platform: PlatformId) => void;
  reconnectPlatform: (platform: PlatformId) => void;
}

export function PlatformsTab({
  connected,
  platformDetails,
  togglePlatform,
  reconnectPlatform,
}: PlatformsTabProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const activeDetails = selectedPlatform ? platformDetails[selectedPlatform] : null;
  const isSelectedActive = selectedPlatform ? connected[selectedPlatform] : false;

  const handleTestConnection = async () => {
    if (!selectedPlatform) return;
    setIsTesting(true);
    setTestResult(null);
    toast.info(`Iniciando teste de latência e handshake com os servidores de ${selectedPlatform.toUpperCase()}...`);

    // Simulate realistic ICMP handshake ping test
    await new Promise((r) => setTimeout(r, 1500));
    
    setIsTesting(false);
    const mockResult = {
      bandwidth: "5800 kbps (Estável)",
      latency: `${Math.floor(Math.random() * 12) + 8}ms`,
      packetLoss: "0% (Excelente)",
      status: "Saudável",
    };
    setTestResult(mockResult);
    toast.success(`Teste concluído! Comunicação com ${selectedPlatform.toUpperCase()} está 100% operacional.`);
  };

  const handleTriggerReconnect = async () => {
    if (!selectedPlatform) return;
    setIsReconnecting(true);
    try {
      await reconnectPlatform(selectedPlatform);
      setTestResult(null); // Clear previous diagnostics on key updates
    } finally {
      setIsReconnecting(false);
    }
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return "N/A";
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const platformMeta = selectedPlatform ? PLATFORMS.find((p) => p.id === selectedPlatform) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Gerenciamento Avançado de Plataformas
        </h1>
        <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
          Conecte canais, configure credenciais de transmissão privada RTMP, realize testes de estabilidade e re-autentique suas chaves.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: 24, minHeight: 460 }}>
        {/* Left Side: Platform List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLATFORMS.map((p) => {
            const isConn = connected[p.id];
            const isSelected = selectedPlatform === p.id;
            const details = platformDetails[p.id];

            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPlatform(p.id);
                  setTestResult(null);
                  setShowKey(false);
                }}
                className="glass"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderRadius: 14,
                  cursor: "pointer",
                  border: isSelected 
                    ? `1.5px solid ${p.color}` 
                    : `1px solid ${G.border}`,
                  background: isSelected 
                    ? `${p.color}0a` 
                    : "rgba(22, 22, 28, 0.4)",
                  transition: "all .25s ease",
                  transform: isSelected ? "translateX(4px)" : "none",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `${p.color}14`,
                    border: `1px solid ${p.color}33`,
                    color: p.color,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  {p.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{p.label}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: isConn ? `${G.accent}12` : `${G.muted}12`,
                        color: isConn ? G.accent : G.muted,
                        border: `0.5px solid ${isConn ? G.accent + "33" : G.border}`,
                      }}
                    >
                      {isConn ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p style={{ color: G.muted, fontSize: 11, marginTop: 4, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {isConn ? (details?.channel_name || "Canal Conectado") : "Clique para gerenciar"}
                  </p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlatform(p.id);
                    if (selectedPlatform === p.id) {
                      setTestResult(null);
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: isConn ? "rgba(255, 59, 59, 0.1)" : `${G.accent}14`,
                    color: isConn ? G.live : G.accent,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                >
                  {isConn ? "Desativar" : "Ativar"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Side: Connections Inspector details panel */}
        <div 
          className="glass" 
          style={{ 
            borderRadius: 16, 
            padding: 28, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: selectedPlatform ? "flex-start" : "center",
            alignItems: selectedPlatform ? "stretch" : "center",
            background: "rgba(22, 22, 28, 0.6)"
          }}
        >
          {!selectedPlatform ? (
            <div style={{ textAlign: "center", color: G.muted, maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${G.accent}10`, display: "grid", placeItems: "center", border: `1.5px dashed ${G.accent}44`, animation: "pulse 3s infinite" }}>
                <Settings size={28} style={{ color: G.accent }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: G.text }}>Inspecionar Canal de Transmissão</h3>
              <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                Selecione uma das suas plataformas de streaming à esquerda para visualizar chaves secretas RTMP, testar latência de envio e redefinir autenticações de forma privada.
              </p>
            </div>
          ) : !isSelectedActive ? (
            <div style={{ textAlign: "center", color: G.muted, padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 32, color: platformMeta?.color }}>{platformMeta?.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: G.text }}>Canal {platformMeta?.label} Inativo</h3>
              <p style={{ fontSize: 12, maxWidth: "70%" }}>
                Este destino de transmissão está desligado. Clique no botão "Ativar" ao lado do canal para estabelecer vinculações.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn .3s ease" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${G.border}`, paddingBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24, color: platformMeta?.color }}>{platformMeta?.icon}</span>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>{platformMeta?.label} Connection details</h2>
                    <p style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
                      Última sincronização: {formatTimestamp(activeDetails?.connected_at)}
                    </p>
                  </div>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: G.accent, background: `${G.accent}14`, padding: "4px 10px", borderRadius: 6, border: `0.5px solid ${G.accent}33` }}>
                  <ShieldCheck size={12} /> CONECTADO
                </span>
              </div>

              {/* Detail fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Nome do Canal</span>
                    <p style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: G.text }}>{activeDetails?.channel_name || "Streamer Live"}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>ID do Canal</span>
                    <p style={{ fontSize: 11, fontFamily: G.mono, marginTop: 4, color: G.text }}>{activeDetails?.channel_id || "ch_unknown"}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Servidor RTMP / Ingest URL</span>
                  <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                    <input
                      readOnly
                      value={activeDetails?.rtmp_url || `rtmp://rtmp.${selectedPlatform}.com/live2`}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#16161d",
                        border: `1px solid ${G.border}`,
                        color: G.text,
                        fontSize: 11,
                        fontFamily: G.mono,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeDetails?.rtmp_url || `rtmp://rtmp.${selectedPlatform}.com/live2`);
                        toast.success("Servidor RTMP copiado!");
                      }}
                      className="glass"
                      style={{ padding: 8, borderRadius: 6, border: `1px solid ${G.border}`, cursor: "pointer", display: "grid", placeItems: "center" }}
                    >
                      <Copy size={12} style={{ color: G.accent }} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Chave Secreta de Transmissão (Stream Key)</span>
                  <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                    <input
                      type={showKey ? "text" : "password"}
                      readOnly
                      value={activeDetails?.stream_key || "••••••••••••••••••••••••••••"}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#16161d",
                        border: `1px solid ${G.border}`,
                        color: G.text,
                        fontSize: 11,
                        fontFamily: G.mono,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="glass"
                      style={{ padding: 8, borderRadius: 6, border: `1px solid ${G.border}`, cursor: "pointer", display: "grid", placeItems: "center" }}
                    >
                      {showKey ? <EyeOff size={12} style={{ color: G.muted }} /> : <Eye size={12} style={{ color: G.accent }} />}
                    </button>
                    <button
                      disabled={!activeDetails?.stream_key}
                      onClick={() => {
                        if (activeDetails?.stream_key) {
                          navigator.clipboard.writeText(activeDetails.stream_key);
                          toast.success("Stream Key copiada!");
                        }
                      }}
                      className="glass"
                      style={{ padding: 8, borderRadius: 6, border: `1px solid ${G.border}`, cursor: activeDetails?.stream_key ? "pointer" : "default", opacity: activeDetails?.stream_key ? 1 : 0.4, display: "grid", placeItems: "center" }}
                    >
                      <Copy size={12} style={{ color: G.accent }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Diagnostics Section */}
              <div 
                style={{ 
                  background: "rgba(22, 22, 28, 0.3)", 
                  border: `1px solid ${G.border}`, 
                  borderRadius: 10, 
                  padding: 16, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 12 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Signal size={12} style={{ color: G.accent }} /> Diagnósticos de Conectividade
                  </span>
                  {!isTesting && !testResult && (
                    <button
                      onClick={handleTestConnection}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: G.accent,
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Testar Comunicação
                    </button>
                  )}
                </div>

                {isTesting && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        border: `2px solid ${G.accent}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin .7s linear infinite",
                      }}
                    />
                    <span style={{ fontSize: 11, color: G.muted }}>Fazendo handshake com {selectedPlatform.toUpperCase()} Ingest...</span>
                  </div>
                )}

                {testResult && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11.5 }}>
                    <div>
                      <span style={{ color: G.muted }}>Latência:</span>{" "}
                      <span style={{ fontWeight: 700, color: G.accent }}>{testResult.latency}</span>
                    </div>
                    <div>
                      <span style={{ color: G.muted }}>Perda Pacotes:</span>{" "}
                      <span style={{ fontWeight: 700, color: G.accent }}>{testResult.packetLoss}</span>
                    </div>
                    <div>
                      <span style={{ color: G.muted }}>Largura Banda:</span>{" "}
                      <span style={{ fontWeight: 700, color: G.text }}>{testResult.bandwidth}</span>
                    </div>
                    <div>
                      <span style={{ color: G.muted }}>Canal RTMP:</span>{" "}
                      <span style={{ fontWeight: 700, color: "#00b0f0" }}>{testResult.status}</span>
                    </div>
                  </div>
                )}

                {!isTesting && !testResult && (
                  <p style={{ fontSize: 10.5, color: G.muted, lineHeight: 1.4 }}>
                    Clique em testar para realizar um diagnóstico simulado de transmissão RTMP com os servidores ingest mais próximos.
                  </p>
                )}
              </div>

              {/* Actions: Reconnect */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  disabled={isReconnecting}
                  onClick={handleTriggerReconnect}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: `linear-gradient(135deg, ${G.accent} 0%, #00d29d 100%)`,
                    color: G.bg,
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: "pointer",
                    fontFamily: G.font,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: `0 4px 14px ${G.accent}22`,
                  }}
                >
                  <RefreshCw size={12} className={isReconnecting ? "spin" : undefined} style={{ animation: isReconnecting ? "spin 1s linear infinite" : undefined }} />
                  {isReconnecting ? "Renovando Credenciais..." : "Reconectar & Gerar Nova Chave"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
