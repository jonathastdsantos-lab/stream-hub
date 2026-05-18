import React from "react";
import { MessageSquare, Send } from "lucide-react";
import { G, PLATFORMS, pColor, PlatformId } from "./constants";
import { ChatMsg } from "../../lib/stores/chat.store";

interface ChatTabProps {
  live: boolean;
  chatMsg: string;
  setChatMsg: (msg: string) => void;
  chatFilter: string;
  setChatFilter: (filter: string) => void;
  filteredChat: ChatMsg[];
  sendChat: () => void;
  connected: Record<PlatformId, boolean>;
  chatRef: React.RefObject<HTMLDivElement>;
}

export function ChatTab({
  live,
  chatMsg,
  setChatMsg,
  chatFilter,
  setChatFilter,
  filteredChat,
  sendChat,
  connected,
  chatRef,
}: ChatTabProps) {
  const activeConnectedPlatforms = Object.keys(connected).filter(
    (k) => connected[k as PlatformId]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Chat Integrado Multicanais
          </h1>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
            Filtre e responda às mensagens de todos os canais simultaneamente em uma interface expandida.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, padding: 4, background: "#16161d", borderRadius: 10, border: `1px solid ${G.border}` }}>
          {["all", ...activeConnectedPlatforms].map((f) => (
            <button
              key={f}
              onClick={() => setChatFilter(f)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                background: chatFilter === f ? G.accent : "transparent",
                color: chatFilter === f ? G.bg : G.muted,
                transition: "all .2s"
              }}
            >
              {f === "all" ? "Todos os chats" : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 460 }}>
        <div
          ref={chatRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 20,
            paddingRight: 6,
          }}
        >
          {filteredChat.length === 0 ? (
            <div style={{ flex: 1, display: "grid", placeItems: "center", color: G.muted, textAlign: "center" }}>
              <div>
                <MessageSquare size={48} style={{ color: G.border, marginBottom: 12 }} />
                <p style={{ fontWeight: 600 }}>Nenhuma mensagem encontrada</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Ajuste os filtros ou aguarde novas interações dos espectadores.</p>
              </div>
            </div>
          ) : (
            filteredChat.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(28, 28, 36, 0.4)",
                  border: `1px solid ${G.border}`,
                  animation: "slideIn .25s ease",
                  fontSize: 13.5,
                }}
              >
                <span style={{ 
                  color: pColor(m.platform), 
                  fontSize: 10, 
                  fontWeight: 900,
                  background: `${pColor(m.platform)}18`,
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: `0.5px solid ${pColor(m.platform)}44`
                }}>
                  {PLATFORMS.find((p) => p.id === m.platform)?.icon} {m.platform.toUpperCase()}
                </span>
                <span style={{ fontWeight: 800, color: pColor(m.platform) }}>{m.user}</span>
                <span style={{ color: G.text, flex: 1, lineHeight: 1.5 }}>{m.msg}</span>
                <span style={{ fontSize: 10, color: G.muted, fontFamily: G.mono }}>{m.time}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder={live ? `Digitando no chat de ${chatFilter === "all" ? "todas as redes" : chatFilter}...` : "Inicie a transmissão para interagir..."}
            disabled={!live}
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 10,
              background: "#16161d",
              border: `1px solid ${G.border}`,
              color: G.text,
              fontSize: 13.5,
              outline: "none",
              fontFamily: G.font,
            }}
          />
          <button
            onClick={sendChat}
            disabled={!live || !chatMsg.trim()}
            style={{
              padding: "0 26px",
              borderRadius: 10,
              border: "none",
              background: live && chatMsg.trim() ? G.accent : G.border,
              color: live && chatMsg.trim() ? G.bg : G.muted,
              fontWeight: 800,
              fontSize: 14,
              cursor: live && chatMsg.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all .2s",
            }}
          >
            <Send size={14} /> Responder
          </button>
        </div>
      </div>
    </div>
  );
}
