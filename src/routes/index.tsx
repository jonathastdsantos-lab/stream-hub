import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

type PlatformId = "youtube" | "twitch" | "kick" | "tiktok" | "facebook";

const PLATFORMS: { id: PlatformId; label: string; color: string; icon: string }[] = [
  { id: "youtube", label: "YouTube", color: "#FF0000", icon: "▶" },
  { id: "twitch", label: "Twitch", color: "#9146FF", icon: "⬡" },
  { id: "kick", label: "Kick", color: "#53FC18", icon: "◆" },
  { id: "tiktok", label: "TikTok", color: "#EE1D52", icon: "♪" },
  { id: "facebook", label: "Facebook", color: "#1877F2", icon: "f" },
];

type ChatMsg = { user: string; msg: string; platform: PlatformId; time: string };

const FAKE_CHAT: ChatMsg[] = [
  { user: "gamer_br99", msg: "LIVE GO!! 🔥", platform: "twitch", time: "21:04" },
  { user: "ana_stream", msg: "Boa noite galera!", platform: "youtube", time: "21:04" },
  { user: "xp_hunter", msg: "primeiro!!", platform: "kick", time: "21:05" },
  { user: "marquinhos777", msg: "bora bora!! manda ver", platform: "twitch", time: "21:05" },
  { user: "carol.live", msg: "Chegando do trabalho 😅", platform: "tiktok", time: "21:06" },
  { user: "streamer_cult", msg: "que jogo hoje?", platform: "youtube", time: "21:06" },
  { user: "br_mafia", msg: "KKKKKK caiu a net dnv?", platform: "facebook", time: "21:07" },
  { user: "jota_gamer", msg: "clip disso!", platform: "kick", time: "21:07" },
];

const pColor = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)?.color ?? "#888";

const G = {
  bg: "#08080a",
  surface: "#111114",
  card: "#17171b",
  border: "#2a2a32",
  text: "#e8e8f0",
  muted: "#7a7a8c",
  accent: "#00e5b0",
  live: "#ff3b3b",
  font: "'Syne', 'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${G.bg};color:${G.text};font-family:${G.font};min-height:100vh;}
  input,button{font-family:inherit;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:4px;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{background:${G.live}}50%{background:#7a1a1a}}
`;

const Dot = ({ live }: { live?: boolean }) => (
  <span
    style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: live ? G.live : G.muted,
      animation: live ? "blink 1.2s infinite" : undefined,
    }}
  />
);

const Tag = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "3px 8px",
      borderRadius: 4,
      background: `${color}22`,
      color,
      border: `0.5px solid ${color}55`,
    }}
  >
    {children}
  </span>
);

const StatCard = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) => (
  <div
    style={{
      background: G.card,
      border: `1px solid ${G.border}`,
      borderRadius: 12,
      padding: 18,
      animation: "fadeIn .4s ease",
    }}
  >
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: G.muted,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 28,
        fontWeight: 700,
        marginTop: 8,
        color: color ?? G.text,
        fontFamily: G.mono,
      }}
    >
      {value}
    </div>
    {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

function AuthPage({ onLogin }: { onLogin: (name: string) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = () => {
    if (!email || !pass || (tab === "register" && !name)) {
      setErr("Preencha todos os campos.");
      return;
    }
    setErr("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(name || email.split("@")[0]);
    }, 1400);
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    background: "#1c1c22",
    border: `1px solid ${G.border}`,
    color: G.text,
    fontSize: 14,
    outline: "none",
    transition: "border-color .2s",
  };
  const btn = (primary: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "13px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    letterSpacing: "0.04em",
    background: primary ? G.accent : "#1c1c22",
    color: primary ? "#08080a" : G.muted,
    transition: "opacity .15s, transform .1s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: `radial-gradient(circle at 30% 20%, ${G.accent}11, transparent 50%), radial-gradient(circle at 70% 80%, ${G.live}0d, transparent 50%), ${G.bg}`,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: G.surface,
          border: `1px solid ${G.border}`,
          borderRadius: 16,
          padding: 36,
          animation: "fadeIn .5s ease",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: G.accent, letterSpacing: "-0.02em" }}>
            ⬡ StreamHub
          </div>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 6 }}>
            Plataforma de streaming ao vivo
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            background: "#1c1c22",
            borderRadius: 10,
            marginBottom: 22,
          }}
        >
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setErr("");
              }}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all .2s",
                background: tab === t ? G.accent : "transparent",
                color: tab === t ? G.bg : G.muted,
              }}
            >
              {t === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tab === "register" && (
            <input
              placeholder="Nome do canal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = G.accent)}
              onBlur={(e) => (e.target.style.borderColor = G.border)}
              style={inp}
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = G.accent)}
            onBlur={(e) => (e.target.style.borderColor = G.border)}
            style={inp}
          />
          <input
            placeholder="Senha"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = G.accent)}
            onBlur={(e) => (e.target.style.borderColor = G.border)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={inp}
          />
          {err && (
            <p style={{ color: G.live, fontSize: 12, fontWeight: 500 }}>{err}</p>
          )}
          <button onClick={submit} disabled={loading} style={btn(true)}>
            {loading ? (
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  border: `2px solid ${G.bg}`,
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin .7s linear infinite",
                }}
              />
            ) : tab === "login" ? (
              "Entrar na plataforma"
            ) : (
              "Criar minha conta"
            )}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "24px 0 16px",
            color: G.muted,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <div style={{ flex: 1, height: 1, background: G.border }} />
          ou continue com
          <div style={{ flex: 1, height: 1, background: G.border }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {["Google", "Discord"].map((s) => (
            <button
              key={s}
              style={{
                ...btn(false),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {s === "Google" ? "G" : "☁"} {s}
            </button>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: G.muted, marginTop: 22 }}>
          Ao continuar você concorda com os Termos de Uso
        </p>
      </div>
    </div>
  );
}

const NAVITEMS = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "stream", icon: "⬡", label: "Ao vivo" },
  { id: "chat", icon: "◉", label: "Chat" },
  { id: "platforms", icon: "⊞", label: "Plataformas" },
  { id: "analytics", icon: "◫", label: "Analytics" },
  { id: "settings", icon: "⚙", label: "Configurações" },
];

function Sidebar({
  active,
  onNav,
  userName,
  live,
}: {
  active: string;
  onNav: (id: string) => void;
  userName: string;
  live: boolean;
}) {
  return (
    <aside
      style={{
        width: 240,
        background: G.surface,
        borderRight: `1px solid ${G.border}`,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minHeight: "100vh",
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: G.accent, letterSpacing: "-0.02em" }}>
          ⬡ StreamHub
        </div>
        <p style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Painel do criador</p>
      </div>

      {live && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: `${G.live}18`,
            border: `0.5px solid ${G.live}55`,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: G.live,
          }}
        >
          <Dot live />
          AO VIVO AGORA
        </div>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {NAVITEMS.map((it) => (
          <button
            key={it.id}
            onClick={() => onNav(it.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: active === it.id ? `${G.accent}18` : "transparent",
              color: active === it.id ? G.accent : G.muted,
              fontFamily: G.font,
              fontSize: 13,
              fontWeight: active === it.id ? 600 : 400,
              textAlign: "left",
              transition: "all .15s",
            }}
          >
            <span style={{ fontSize: 15 }}>{it.icon}</span>
            {it.label}
            {active === it.id && (
              <span
                style={{
                  marginLeft: "auto",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: G.accent,
                }}
              />
            )}
          </button>
        ))}
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 10,
          background: G.card,
          borderRadius: 10,
          border: `1px solid ${G.border}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: G.accent,
            color: G.bg,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
          }}
        >
          {userName[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{userName}</p>
          <p style={{ fontSize: 10, color: G.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Plano Pro
          </p>
        </div>
      </div>
    </aside>
  );
}

function Dashboard({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const [nav, setNav] = useState("dashboard");
  const [live, setLive] = useState(false);
  const [connected, setConnected] = useState<Record<PlatformId, boolean>>({
    youtube: false,
    twitch: true,
    kick: false,
    tiktok: false,
    facebook: false,
  });
  const [duration, setDuration] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>(FAKE_CHAT);
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    if (live) {
      t = setInterval(() => {
        setDuration((d) => d + 1);
        setViewers((v) => Math.max(0, v + Math.floor(Math.random() * 30) - 10));
      }, 1000);
    } else {
      setDuration(0);
      setViewers(0);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [live]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatLog]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const connCount = Object.values(connected).filter(Boolean).length;

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatLog((l) => [
      ...l,
      {
        user: userName,
        msg: chatMsg,
        platform: "twitch",
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setChatMsg("");
  };

  const togglePlatform = (id: PlatformId) =>
    setConnected((c) => ({ ...c, [id]: !c[id] }));

  const panels: Record<string, React.ReactNode> = {
    dashboard: (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Olá, {userName} 👋
            </h1>
            <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
              Pronto para ir ao vivo?
            </p>
          </div>
          <button
            onClick={() => setLive((l) => !l)}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: live ? G.live : G.accent,
              color: live ? "#fff" : G.bg,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: G.font,
              letterSpacing: "0.04em",
              boxShadow: live ? `0 0 24px ${G.live}55` : `0 0 24px ${G.accent}44`,
              transition: "all .2s",
            }}
          >
            {live ? "⬛ Encerrar live" : "▶ Iniciar live"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          <StatCard label="Status" value={live ? "AO VIVO" : "Offline"} color={live ? G.live : G.muted} sub={live ? "transmitindo" : "pronto p/ iniciar"} />
          <StatCard label="Duração" value={fmt(duration)} sub="hh:mm:ss" />
          <StatCard label="Espectadores" value={String(viewers)} color={G.accent} sub="em todas plataformas" />
          <StatCard label="Plataformas" value={`${connCount}/${PLATFORMS.length}`} sub="conectadas" />
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G.muted, marginBottom: 14 }}>
            Plataformas ativas
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `0.5px solid ${connected[p.id] ? p.color + "77" : G.border}`,
                  background: connected[p.id] ? p.color + "15" : "transparent",
                  transition: "all .2s",
                  color: G.text,
                  fontFamily: G.font,
                  fontSize: 13,
                }}
              >
                <span style={{ color: p.color, fontSize: 14 }}>{p.icon}</span>
                {p.label}
                <Dot live={connected[p.id]} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G.muted, marginBottom: 14 }}>
            Chat ao vivo
          </h3>
          <div
            ref={chatRef}
            style={{
              maxHeight: 260,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {chatLog.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "baseline",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "#1c1c22",
                  animation: "slideIn .3s ease",
                  fontSize: 13,
                }}
              >
                <span style={{ color: pColor(m.platform), fontSize: 11 }}>
                  {PLATFORMS.find((p) => p.id === m.platform)?.icon}
                </span>
                <span style={{ fontWeight: 600, color: pColor(m.platform) }}>{m.user}</span>
                <span style={{ color: G.text, flex: 1 }}>{m.msg}</span>
                <span style={{ fontSize: 10, color: G.muted, fontFamily: G.mono }}>{m.time}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Responder no chat…"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 7,
                background: "#1c1c22",
                border: `1px solid ${G.border}`,
                color: G.text,
                fontSize: 13,
                outline: "none",
                fontFamily: G.font,
              }}
            />
            <button
              onClick={sendChat}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                border: "none",
                background: G.accent,
                color: G.bg,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    ),

    platforms: (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Plataformas conectadas
        </h1>
        <p style={{ color: G.muted, fontSize: 13 }}>
          Conecte suas contas para transmitir simultâneas
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {PLATFORMS.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 16,
                background: G.card,
                border: `1px solid ${G.border}`,
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: `${p.color}18`,
                  border: `0.5px solid ${p.color}55`,
                  color: p.color,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                }}
              >
                {p.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{p.label}</p>
                <p style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>
                  {connected[p.id] ? "Conta conectada via OAuth" : "Não conectado"}
                </p>
              </div>
              <Tag color={connected[p.id] ? G.accent : G.muted}>
                {connected[p.id] ? "Ativo" : "Desconectado"}
              </Tag>
              <button
                onClick={() => togglePlatform(p.id)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 7,
                  border: `0.5px solid ${connected[p.id] ? G.live + "88" : G.accent + "88"}`,
                  background: "transparent",
                  color: connected[p.id] ? G.live : G.accent,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: G.font,
                }}
              >
                {connected[p.id] ? "Desconectar" : "Conectar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    ),

    settings: (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Configurações da conta
        </h1>
        <p style={{ color: G.muted, fontSize: 13 }}>Gerencie seu perfil e segurança</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {[
            ["Nome do canal", userName],
            ["Email", "streamer@email.com"],
            ["Idioma", "Português (BR)"],
          ].map(([lbl, val]) => (
            <div
              key={lbl}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 14,
                background: G.card,
                border: `1px solid ${G.border}`,
                borderRadius: 10,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: G.muted,
                  fontWeight: 600,
                }}
              >
                {lbl}
              </label>
              <input
                defaultValue={val}
                style={{
                  background: "transparent",
                  border: "none",
                  color: G.text,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: G.font,
                }}
              />
            </div>
          ))}
          <button
            onClick={onLogout}
            style={{
              padding: "11px",
              borderRadius: 8,
              border: `0.5px solid ${G.live}88`,
              background: "transparent",
              color: G.live,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              marginTop: 8,
              fontFamily: G.font,
            }}
          >
            Sair da conta
          </button>
        </div>
      </div>
    ),
  };

  const panel = panels[nav] || (
    <div style={{ textAlign: "center", padding: 80, color: G.muted }}>
      <div style={{ fontSize: 48, color: G.accent, marginBottom: 12 }}>◈</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: G.text }}>Em construção</h2>
      <p style={{ fontSize: 13, marginTop: 6 }}>Próxima fase</p>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: G.bg }}>
      <Sidebar active={nav} onNav={setNav} userName={userName} live={live} />
      <main style={{ flex: 1, padding: "32px 36px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {panel}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<string | null>(null);
  return (
    <>
      <style>{css}</style>
      {user ? (
        <Dashboard userName={user} onLogout={() => setUser(null)} />
      ) : (
        <AuthPage onLogin={setUser} />
      )}
    </>
  );
}
