import React from "react";
import { Radio, Copy, Info, Sparkles } from "lucide-react";
import { G } from "./constants";
import { RtmpKeyManager } from "../RtmpKeyManager";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

interface LiveTabProps {
  live: boolean;
  viewers: number;
  activeStream: any;
  connectionsList: any[];
  userId: string;
}

export function LiveTab({
  live,
  viewers,
  activeStream,
  connectionsList,
  userId,
}: LiveTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, animation: "fadeIn .4s ease" }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Transmissão de Vídeo (Console OBS / Streamlabs)
        </h1>
        <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
          Configure seu software de transmissão (OBS Studio, Streamlabs ou vMix) usando os dados abaixo.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flexWrap: "wrap" }}>
        {/* Feed Preview */}
        <div className="glass" style={{ borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted }}>
            Retorno do Feed de Transmissão
          </h3>
          <div
            style={{
              flex: 1,
              minHeight: 220,
              background: "#08080c",
              borderRadius: 10,
              border: `1px solid ${G.border}`,
              display: "grid",
              placeItems: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {live ? (
              <>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "radial-gradient(circle, transparent 20%, rgba(0,240,181,0.05) 100%)",
                  animation: "pulse 3s infinite ease-in-out",
                }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 2 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `${G.live}22`,
                    border: `2px solid ${G.live}`,
                    display: "grid",
                    placeItems: "center",
                    animation: "pulse 1.5s infinite"
                  }}>
                    <Radio size={20} style={{ color: G.live }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: G.live, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Sinal de Vídeo Recebido — ONLINE
                  </span>
                  <span style={{ fontSize: 11, color: G.muted, fontFamily: G.mono }}>
                    {viewers} espectadores assistindo • {activeStream?.platforms?.join(", ").toUpperCase()}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: G.muted }}>
                <Radio size={32} style={{ color: G.border }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>Servidor Offline</p>
                <p style={{ fontSize: 11, width: "80%", textAlign: "center" }}>
                  Inicie a live na aba Dashboard para ativar a recepção do feed RTMP.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Credentials */}
        <div className="glass" style={{ borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted }}>
            Configurações de Conexão RTMP
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                URL de Transmissão (RTMP)
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  readOnly
                  value="rtmp://rtmp.bhulwmlylatmxkiajjrn.supabase.co:1935/live"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#16161d",
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    fontSize: 12,
                    fontFamily: G.mono,
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("rtmp://rtmp.bhulwmlylatmxkiajjrn.supabase.co:1935/live");
                    toast.success("URL RTMP copiada para a área de transferência!");
                  }}
                  className="glass"
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${G.border}`,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <Copy size={14} style={{ color: G.accent }} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Chave Secreta de Transmissão
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="password"
                  readOnly
                  value={activeStream ? `live_key_${activeStream.id.substring(0, 8)}` : "••••••••••••••••••••"}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#16161d",
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    fontSize: 12,
                    fontFamily: G.mono,
                    outline: "none"
                  }}
                />
                <button
                  disabled={!activeStream}
                  onClick={() => {
                    if (activeStream) {
                      navigator.clipboard.writeText(`live_key_${activeStream.id.substring(0, 8)}`);
                      toast.success("Chave de transmissão copiada!");
                    }
                  }}
                  className="glass"
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${G.border}`,
                    cursor: activeStream ? "pointer" : "default",
                    opacity: activeStream ? 1 : 0.4,
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <Copy size={14} style={{ color: G.accent }} />
                </button>
              </div>
              <span style={{ fontSize: 10, color: G.muted, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Info size={10} /> Esta chave é secreta e única para cada sessão ao vivo. Nunca revele a chave em tela.
              </span>
            </div>
          </div>

          <div style={{ background: "rgba(0, 240, 181, 0.05)", border: `1px solid ${G.accent}33`, borderRadius: 10, padding: 14, display: "flex", gap: 10, marginTop: "auto" }}>
            <Sparkles size={16} style={{ color: G.accent, flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, lineHeight: "1.4", color: G.text }}>
              <span style={{ fontWeight: 700, color: G.accent }}>Transmissão com Latência Ultra-Baixa</span>:
              Nosso hub redistribui automaticamente o sinal de vídeo para as plataformas ativadas em menos de 1.5 segundos de delay.
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 28 }}>
        <RtmpKeyManager
          userId={userId}
          supabaseClient={supabase}
          connections={connectionsList}
        />
      </div>
    </div>
  );
}
