import React from "react";
import { MessageSquare, Send, EyeOff, Eye, UserX, AlertTriangle, Link } from "lucide-react";
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
  banUser: (username: string) => void;
  hideMessage: (msgId: string) => void;
  revealMessage: (msgId: string) => void;
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
  banUser,
  hideMessage,
  revealMessage,
}: ChatTabProps) {
  const activeConnectedPlatforms = Object.keys(connected).filter(
    (k) => connected[k as PlatformId]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Chat Integrado Multicanais & Moderação
          </h1>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
            Monitore interações, analise alertas heurísticos de spam e aplique moderações instantâneas nas transmissões ativas.
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
                <p style={{ fontWeight: 600 }}>Nenhuma mensagem ativa</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Aguarde novas interações dos espectadores das redes integradas.</p>
              </div>
            </div>
          ) : (
            filteredChat.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: m.spamAlert ? "rgba(255, 59, 59, 0.05)" : "rgba(28, 28, 36, 0.4)",
                  border: `1px solid ${m.spamAlert ? G.live + "44" : G.border}`,
                  animation: "slideIn .25s ease",
                  fontSize: 13.5,
                  position: "relative",
                }}
              >
                {/* Platform Tag */}
                <span style={{ 
                  color: pColor(m.platform), 
                  fontSize: 10, 
                  fontWeight: 900,
                  background: `${pColor(m.platform)}18`,
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: `0.5px solid ${pColor(m.platform)}44`,
                  flexShrink: 0
                }}>
                  {PLATFORMS.find((p) => p.id === m.platform)?.icon} {m.platform.toUpperCase()}
                </span>

                {/* Username */}
                <span style={{ fontWeight: 800, color: pColor(m.platform), flexShrink: 0 }}>
                  {m.user}
                </span>

                {/* Content */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {m.spamAlert && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,59,59,0.14)", border: `0.5px solid ${G.live}55`, color: G.live, fontSize: 9, fontWeight: 900, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4 }}>
                      <AlertTriangle size={10} /> SPAM
                    </span>
                  )}
                  {m.linkAlert && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,176,240,0.14)", border: "0.5px solid rgba(0,176,240,0.4)", color: "#00b0f0", fontSize: 9, fontWeight: 900, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4 }}>
                      <Link size={10} /> LINK
                    </span>
                  )}

                  {m.hidden ? (
                    <span style={{ color: G.muted, fontStyle: "italic", fontSize: 13 }}>
                      [Mensagem ocultada por moderação]
                    </span>
                  ) : (
                    <span style={{ color: G.text, lineHeight: 1.5, wordBreak: "break-word" }}>{m.msg}</span>
                  )}
                </div>

                {/* Time */}
                <span style={{ fontSize: 10, color: G.muted, fontFamily: G.mono, marginLeft: 8, flexShrink: 0 }}>
                  {m.time}
                </span>

                {/* Moderation actions control buttons */}
                <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
                  {m.hidden ? (
                    <button
                      onClick={() => revealMessage(m.id)}
                      title="Exibir mensagem novamente"
                      className="glass"
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        border: `1px solid ${G.accent}44`,
                        cursor: "pointer",
                        background: `${G.accent}12`,
                        display: "grid",
                        placeItems: "center"
                      }}
                    >
                      <Eye size={12} style={{ color: G.accent }} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => hideMessage(m.id)}
                        title="Ocultar mensagem"
                        className="glass"
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: `1px solid ${G.border}`,
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        <EyeOff size={12} style={{ color: G.muted }} />
                      </button>
                      <button
                        onClick={() => {
                          const confirmBan = window.confirm(`Deseja realmente banir o streamer/espectador ${m.user}? Suas mensagens serão apagadas.`);
                          if (confirmBan) {
                            banUser(m.user);
                          }
                        }}
                        title="Banir usuário rapidamente"
                        className="glass"
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: `1px solid ${G.live}44`,
                          cursor: "pointer",
                          background: `${G.live}0d`,
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        <UserX size={12} style={{ color: G.live }} />
                      </button>
                    </>
                  )}
                </div>
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
