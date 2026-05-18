import React from "react";
import { 
  Tv, 
  LayoutDashboard, 
  Radio, 
  MessageSquare, 
  Globe, 
  Activity, 
  Settings, 
  Sparkles 
} from "lucide-react";
import { G } from "./constants";

const NAVITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "stream", icon: Radio, label: "Ao vivo" },
  { id: "chat", icon: MessageSquare, label: "Chat completo" },
  { id: "platforms", icon: Globe, label: "Plataformas" },
  { id: "analytics", icon: Activity, label: "Analytics" },
  { id: "settings", icon: Settings, label: "Configurações" },
];

const Dot = ({ live }: { live?: boolean }) => (
  <span
    style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: live ? G.live : G.muted,
      animation: live ? "blink 1.4s infinite" : undefined,
    }}
  />
);

interface SidebarProps {
  active: string;
  onNav: (id: string) => void;
  userName: string;
  live: boolean;
  plan: string;
  avatarLetter: string;
}

export function Sidebar({
  active,
  onNav,
  userName,
  live,
  plan,
  avatarLetter,
}: SidebarProps) {
  return (
    <aside
      className="glass"
      style={{
        width: 260,
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        minHeight: "100vh",
        borderTop: "none",
        borderBottom: "none",
        borderLeft: "none",
      }}
    >
      <div>
        <div style={{ 
          fontSize: 22, 
          fontWeight: 800, 
          color: G.accent, 
          letterSpacing: "-0.04em",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <Tv size={20} /> StreamHub
        </div>
        <p style={{ fontSize: 11, color: G.muted, marginTop: 4, letterSpacing: "0.02em" }}>Painel de Streaming</p>
      </div>

      {live && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: `${G.live}14`,
            border: `0.5px solid ${G.live}44`,
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: G.live,
          }}
        >
          <Dot live />
          TRANSMITINDO AGORA
        </div>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {NAVITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onNav(it.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: isActive ? `${G.accent}14` : "transparent",
                color: isActive ? G.accent : G.muted,
                fontFamily: G.font,
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                textAlign: "left",
                transition: "all .2s ease-in-out",
              }}
            >
              <Icon size={18} />
              {it.label}
              {isActive && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: G.accent,
                    boxShadow: `0 0 6px ${G.accent}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${G.accent} 0%, #00b0f0 100%)`,
            color: G.bg,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 16,
            boxShadow: `0 0 10px ${G.accent}33`,
          }}
        >
          {avatarLetter}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: G.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userName}
          </p>
          <p style={{ 
            fontSize: 10, 
            color: plan === "studio" ? "#ffb700" : plan === "pro" ? G.accent : G.muted, 
            letterSpacing: "0.06em", 
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <Sparkles size={8} /> Plano {plan}
          </p>
        </div>
      </div>
    </aside>
  );
}
