import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import { Tv, MessageSquare, Globe, Play, Square, Zap, Info, Wifi, History, Eye, Send } from "lucide-react";

// Zustand state selectors are local now
import { useAnalytics } from "../hooks/useAnalytics";
import { useCallback } from "react";

// Custom React hooks
import { useAuth } from "../hooks/useAuth";
import { useStream } from "../hooks/useStream";
import { useChat } from "../hooks/useChat";
import { usePlatforms } from "../hooks/usePlatforms";

// Modular Dashboard sub-views and global styling tokens
import { G, PLATFORMS, PlatformId, pColor } from "../components/Dashboard/constants";
import { Sidebar } from "../components/Dashboard/Sidebar";
import { LiveTab } from "../components/Dashboard/LiveTab";
import { PlatformsTab } from "../components/Dashboard/PlatformsTab";
import { ChatTab } from "../components/Dashboard/ChatTab";
import { AnalyticsTab } from "../components/Dashboard/AnalyticsTab";
import { SettingsTab } from "../components/Dashboard/SettingsTab";

export const Route = createFileRoute("/")({
  component: App,
});

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${G.bg};color:${G.text};font-family:${G.font};min-height:100vh;overflow-x:hidden;}
  input,button,textarea,select{font-family:inherit;}
  ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:4px;}
  ::-webkit-scrollbar-thumb:hover{background:${G.muted}55;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(0.98)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{background:${G.live};box-shadow: 0 0 12px ${G.live}}50%{background:#801b1b;box-shadow: 0 0 4px #801b1b}}
  @keyframes glow{0%,100%{box-shadow: 0 0 15px rgba(0, 240, 181, 0.2)}50%{box-shadow: 0 0 25px rgba(0, 240, 181, 0.4)}}
  .glass{
    background: rgba(22, 22, 28, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${G.border};
  }
`;

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

const StatCard = ({
  label,
  value,
  color,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  icon: React.ComponentType<any>;
  sub?: string;
}) => (
  <div className="glass" style={{ borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: G.muted }}>
        {label}
      </span>
      <Icon size={16} style={{ color: color || G.muted }} />
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: color || G.text, letterSpacing: "-0.02em" }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 6 }}>{sub}</div>}
  </div>
);

function AuthPage() {
  const { login, register, signInWithGoogle, isLoading, error } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const submit = async () => {
    if (!email || !pass || (tab === "register" && !name)) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSuccessMsg("");

    try {
      if (tab === "register") {
        await register({ email, password: pass, name });
        setSuccessMsg("Conta criada com sucesso! Por favor, faça o login.");
        setTab("login");
      } else {
        await login({ email, password: pass });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro de autenticação.");
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 10,
    background: "#16161d",
    border: `1px solid ${G.border}`,
    color: G.text,
    fontSize: 14,
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  };

  const btn = (primary: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "14px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    letterSpacing: "0.04em",
    background: primary ? G.accent : "#16161d",
    color: primary ? "#08080c" : G.muted,
    transition: "opacity .15s, transform .1s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: `radial-gradient(circle at 10% 10%, ${G.accent}12, transparent 40%), radial-gradient(circle at 90% 90%, ${G.live}0d, transparent 40%), ${G.bg}`,
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 20,
          padding: 40,
          animation: "fadeIn .5s ease",
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5)`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ 
            fontSize: 28, 
            fontWeight: 800, 
            color: G.accent, 
            letterSpacing: "-0.04em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10
          }}>
            <Tv size={26} /> StreamHub
          </div>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 8 }}>
            Painel de Transmissão Multicanais em Tempo Real
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            background: "#16161d",
            borderRadius: 12,
            marginBottom: 26,
            border: `1px solid ${G.border}`,
          }}
        >
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSuccessMsg("");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all .2s",
                background: tab === t ? G.accent : "transparent",
                color: tab === t ? G.bg : G.muted,
              }}
            >
              {t === "login" ? "Entrar" : "Criar Conta"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "register" && (
            <input
              placeholder="Nome do Canal (ex: gamer_pro)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inp}
              onFocus={(e) => {
                e.target.style.borderColor = G.accent;
                e.target.style.boxShadow = `0 0 8px ${G.accent}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = G.border;
                e.target.style.boxShadow = "none";
              }}
            />
          )}
          <input
            placeholder="Seu Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inp}
            onFocus={(e) => {
              e.target.style.borderColor = G.accent;
              e.target.style.boxShadow = `0 0 8px ${G.accent}33`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = G.border;
              e.target.style.boxShadow = "none";
            }}
          />
          <input
            placeholder="Sua Senha"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            style={inp}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={(e) => {
              e.target.style.borderColor = G.accent;
              e.target.style.boxShadow = `0 0 8px ${G.accent}33`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = G.border;
              e.target.style.boxShadow = "none";
            }}
          />
          
          {error && (
            <p style={{ color: G.live, fontSize: 13, fontWeight: 600, animation: "slideIn .2s ease" }}>
              ⚠️ {error}
            </p>
          )}
          {successMsg && (
            <p style={{ color: G.accent, fontSize: 13, fontWeight: 600, animation: "slideIn .2s ease" }}>
              ✅ {successMsg}
            </p>
          )}

          <button onClick={submit} disabled={isLoading} style={btn(true)}>
            {isLoading ? (
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
              <>Entrar no StreamHub</>
            ) : (
              <>Criar Canal Agora</>
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", margin: "8px 0", color: G.muted }}>
            <hr style={{ flex: 1, border: "none", borderTop: `1px solid ${G.border}`, marginRight: 10 }} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>OU</span>
            <hr style={{ flex: 1, border: "none", borderTop: `1px solid ${G.border}`, marginLeft: 10 }} />
          </div>

          <button
            type="button"
            onClick={async () => {
              const res = await signInWithGoogle();
              if (res && !res.success) {
                toast.error(res.error || "Falha ao conectar com o Google");
              }
            }}
            style={{
              ...btn(false),
              background: "#ffffff",
              color: "#16161d",
              border: "1px solid #e5e7eb",
              transition: "transform .1s, background-color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 2 }}>
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.9c1.69-1.55 2.69-3.85 2.69-6.57z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.58-5.05-3.71H.95v2.3C2.43 15.89 5.5 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.95 10.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V4.96H.95C.35 6.17 0 7.55 0 9s.35 2.83.95 4.04l3-2.3z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.99 11.42 0 9 0 5.5 0 2.43 2.11.95 4.96l3 2.3c.71-2.13 2.7-3.68 5.05-3.68z"
              />
            </svg>
            Acessar com o Google
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: G.muted, marginTop: 24, lineHeight: "1.4" }}>
          Ao criar uma conta ou fazer login, você concorda com nossos termos de privacidade e serviço de transmissão multicanais.
        </p>
      </div>
    </div>
  );
}

function DashboardWrapper() {
  const { user, logout, register, login, updateUser } = useAuth();
  const profile = user ? {
    display_name: user.name,
    bio: "Canal do " + user.name,
    plan: (user as any).plan || "free",
  } : null;

  const saveProfile = useCallback(async (displayName: string, bio: string, plan: string) => {
    updateUser({ name: displayName });
    if (user) {
      (user as any).plan = plan;
    }
  }, [user, updateUser]);

  const [activeTab, setActiveTab] = useState("dashboard");

  const streamState = useStream();
  const {
    isLive,
    startStream,
    endStream,
  } = streamState;
  const viewers = streamState.stats.viewers;
  const duration = streamState.stats.duration;

  const currentStream = streamState.streamId ? {
    id: streamState.streamId,
    title: streamState.config?.title || "Stream",
    platforms: [] as string[],
  } : null;

  const chatState = useChat({ streamId: currentStream?.id || "" });
  const { sendMessage, banUser } = chatState;
  const [chatFilter, setChatFilter] = useState("all");

  const messages = chatState.messages.map((m) => ({
    id: m.id,
    platform: m.platform as PlatformId,
    user: m.username,
    msg: m.content,
    time: new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    spamAlert: !!m.metadata?.spamAlert,
    linkAlert: !!m.metadata?.linkAlert,
    hidden: false,
  }));

  const hideMessage = useCallback((id: string) => {
    chatState.deleteMessage(id);
  }, [chatState]);
  const revealMessage = useCallback((id: string) => {}, []);

  const simulateAlert = useCallback(async (platform: string) => {
    toast.info(`Simulação de alerta na plataforma ${platform.toUpperCase()}`);
  }, []);

  const {
    platforms,
    togglePlatform,
    connectPlatform,
  } = usePlatforms();

  const connected = platforms.reduce((acc, p) => {
    acc[p.id] = p.isConnected;
    return acc;
  }, {} as Record<PlatformId, boolean>);

  const platformDetails = platforms.reduce((acc, p) => {
    acc[p.id] = {
      channel_name: p.channelName,
      channel_id: p.channelId,
      rtmp_url: p.rtmpUrl,
      stream_key: p.streamKey,
      connected_at: new Date().toISOString(),
    };
    return acc;
  }, {} as Record<PlatformId, any>);

  const connectionsList = platforms.map(p => ({
    id: p.id,
    platform: p.id,
    channel_name: p.channelName || p.name,
    is_active: p.isConnected,
  }));

  const reconnectPlatform = useCallback(async (platformId: PlatformId) => {
    return connectPlatform(platformId);
  }, [connectPlatform]);

  const analytics = useAnalytics(streamState.streamId || undefined);

  useEffect(() => {
    analytics.fetchHistory();
  }, [analytics.fetchHistory]);

  const streamHistory = analytics.historicalStreams.map(s => ({
    id: s.id,
    title: s.title,
    started_at: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
    ended_at: s.startedAt ? new Date(new Date(s.startedAt).getTime() + s.duration * 1000).toISOString() : new Date().toISOString(),
    peak_viewers: s.peakViewers,
    platforms: s.platforms,
  }));

  const [chatMsg, setChatMsg] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [plan, setPlan] = useState("free");
  const [isSaving, setIsSaving] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null!);

  // Recovery profile states to settings inputs initially
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setPlan(profile.plan || "free");
    }
  }, [profile]);

  // Check for successful OAuth callback redirect and trigger toast + change tab
  useEffect(() => {
    const statusToast = localStorage.getItem("oauth_status_toast");
    if (statusToast === "success_youtube") {
      localStorage.removeItem("oauth_status_toast");
      setActiveTab("platforms");
      toast.success("Canal do YouTube conectado com sucesso! 🎉");
    }
  }, [setActiveTab]);

  // Auto scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const connCount = Object.values(connected).filter(Boolean).length;

  const triggerStartStream = async () => {
    const activePlatforms = Object.keys(connected).filter(
      (k) => connected[k as PlatformId]
    );
    await startStream({
      title: `Live de ${profile?.display_name || user?.name || "Streamer"}`,
      description: `Transmissão multicanais nas redes: ${activePlatforms.join(", ")}`,
    });
  };

  const triggerSendChat = async () => {
    if (!chatMsg.trim()) return;
    await sendMessage(chatMsg);
    setChatMsg("");
  };

  const triggerSaveProfile = async () => {
    setIsSaving(true);
    try {
      await saveProfile(displayName, bio, plan);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerSimulateAlert = async () => {
    const activePlatforms = Object.keys(connected).filter(
      (k) => connected[k as PlatformId]
    ) as PlatformId[];
    const platform = activePlatforms.length > 0 ? activePlatforms[0] : "twitch";
    await simulateAlert(platform);
  };



  // Mock analytics data for visual chart feedback
  const analyticsData = [
    { name: "Live 1", viewers: 24, chatMsgs: 120 },
    { name: "Live 2", viewers: 45, chatMsgs: 180 },
    { name: "Live 3", viewers: 35, chatMsgs: 140 },
    { name: "Live 4", viewers: 68, chatMsgs: 310 },
    { name: "Atual", viewers: viewers > 0 ? viewers : 0, chatMsgs: messages.length },
  ];

  const panels: Record<string, React.ReactNode> = {
    dashboard: (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
              Canal de {profile?.display_name || user?.email?.split("@")[0]} 🚀
            </h1>
            <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
              Transmita simultaneamente para todas as suas redes de forma centralizada!
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {isLive && (
              <button
                onClick={triggerSimulateAlert}
                className="glass"
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: `1px solid ${G.accent}44`,
                  color: G.accent,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: G.font,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all .2s",
                }}
              >
                <Zap size={14} /> Simular Alerta DB
              </button>
            )}
            <button
              onClick={isLive ? endStream : triggerStartStream}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: isLive ? G.live : `linear-gradient(135deg, ${G.accent} 0%, #00d29d 100%)`,
                color: isLive ? "#fff" : G.bg,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: G.font,
                letterSpacing: "0.02em",
                boxShadow: isLive ? `0 0 20px ${G.live}44` : `0 0 20px ${G.accent}44`,
                transition: "all .2s ease-in-out",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isLive ? (
                <>
                  <Square size={14} fill="#fff" /> Encerrar Transmissão
                </>
              ) : (
                <>
                  <Play size={14} fill={G.bg} /> Iniciar Transmissão
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
          <StatCard label="Status do Servidor" value={isLive ? "AO VIVO" : "Offline"} color={isLive ? G.live : G.muted} icon={Wifi} sub={isLive ? "servidor RTMP conectado" : "pronto para iniciar"} />
          <StatCard label="Tempo Decorrido" value={fmt(duration)} icon={History} sub="hh:mm:ss" />
          <StatCard label="Visualizações Atuais" value={String(viewers)} color={G.accent} icon={Eye} sub="soma dos canais ativos" />
          <StatCard label="Canais Conectados" value={`${connCount}/${PLATFORMS.length}`} icon={Globe} sub="plataformas ativas" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Globe size={14} /> Canais Transmitindo Simultaneamente
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {PLATFORMS.map((p) => {
                const isActive = connected[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id, !connected[p.id])}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 18px",
                      borderRadius: 10,
                      cursor: "pointer",
                      border: `1px solid ${isActive ? p.color + "77" : G.border}`,
                      background: isActive ? p.color + "12" : "rgba(22, 22, 28, 0.4)",
                      transition: "all .2s ease-in-out",
                      color: isActive ? G.text : G.muted,
                      fontFamily: G.font,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ color: p.color, fontSize: 14 }}>{p.icon}</span>
                    {p.label}
                    <Dot live={isActive} />
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            {/* Realtime Chat Box */}
            <div className="glass" style={{ borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", minHeight: 360 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare size={14} /> Chat Integrado (Realtime)
              </h3>
              
              <div
                ref={chatRef}
                style={{
                  flex: 1,
                  maxHeight: 280,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 16,
                  paddingRight: 6,
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: "grid", placeItems: "center", color: G.muted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                    <div>
                      <MessageSquare size={36} style={{ color: G.border, marginBottom: 10 }} />
                      <p>O chat está vazio.</p>
                      <p style={{ fontSize: 11, marginTop: 4 }}>Inicie a live e envie uma mensagem para testar a sincronização!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "baseline",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "rgba(28, 28, 36, 0.4)",
                        border: `1px solid ${G.border}`,
                        animation: "slideIn .25s ease",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: pColor(m.platform), fontSize: 11, fontWeight: 800 }}>
                        {PLATFORMS.find((p) => p.id === m.platform)?.icon}
                      </span>
                      <span style={{ fontWeight: 750, color: pColor(m.platform) }}>{m.user}</span>
                      <span style={{ color: G.text, flex: 1, wordBreak: "break-word", lineHeight: 1.4 }}>{m.msg}</span>
                      <span style={{ fontSize: 10, color: G.muted, fontFamily: G.mono }}>{m.time}</span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && triggerSendChat()}
                  placeholder={isLive ? "Escreva sua resposta..." : "Inicie a transmissão para poder digitar no chat..."}
                  disabled={!isLive}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "#16161d",
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    fontSize: 13,
                    outline: "none",
                    fontFamily: G.font,
                  }}
                />
                <button
                  onClick={triggerSendChat}
                  disabled={!isLive || !chatMsg.trim()}
                  style={{
                    padding: "0 22px",
                    borderRadius: 10,
                    border: "none",
                    background: isLive && chatMsg.trim() ? G.accent : G.border,
                    color: isLive && chatMsg.trim() ? G.bg : G.muted,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isLive && chatMsg.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all .2s",
                  }}
                >
                  <Send size={12} /> Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    stream: (
      <LiveTab
        live={isLive}
        viewers={viewers}
        activeStream={currentStream}
        connectionsList={connectionsList}
        userId={user?.id || ""}
      />
    ),
    chat: (
      <ChatTab
        live={isLive}
        chatMsg={chatMsg}
        setChatMsg={setChatMsg}
        chatFilter={chatFilter}
        setChatFilter={setChatFilter}
        filteredChat={messages}
        sendChat={triggerSendChat}
        connected={connected}
        chatRef={chatRef}
        banUser={banUser}
        hideMessage={hideMessage}
        revealMessage={revealMessage}
      />
    ),
    platforms: (
      <PlatformsTab
        connected={connected}
        platformDetails={platformDetails}
        togglePlatform={(platformId) => togglePlatform(platformId, !connected[platformId])}
        reconnectPlatform={reconnectPlatform}
      />
    ),
    analytics: (
      <AnalyticsTab
        analyticsData={analyticsData}
        streamHistory={streamHistory}
      />
    ),
    settings: (
      <SettingsTab
        displayName={displayName}
        setDisplayName={setDisplayName}
        bio={bio}
        setBio={setBio}
        plan={plan}
        setPlan={setPlan}
        saveProfile={triggerSaveProfile}
        isSavingProfile={isSaving}
        user={user}
        onLogout={logout}
      />
    ),
  };

  const panel = panels[activeTab] || (
    <div style={{ textAlign: "center", padding: 80, color: G.muted }}>
      <div style={{ fontSize: 48, color: G.accent, marginBottom: 12 }}>◈</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: G.text }}>Em construção</h2>
      <p style={{ fontSize: 13, marginTop: 6 }}>Próxima fase</p>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: G.bg }}>
      <Sidebar 
        active={activeTab} 
        onNav={setActiveTab} 
        userName={profile?.display_name || user?.email?.split("@")[0] || "Streamer"} 
        live={isLive} 
        plan={profile?.plan || "free"}
        avatarLetter={(profile?.display_name?.[0] || user?.email?.[0] || "S").toUpperCase()}
      />
      <main style={{ flex: 1, padding: "36px 40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {panel}
      </main>
    </div>
  );
}

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: G.bg,
        color: G.accent,
        fontFamily: G.font
      }}>
        <div style={{
          width: 34,
          height: 34,
          border: `3px solid ${G.accent}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin .7s linear infinite"
        }} />
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <Toaster theme="dark" richColors closeButton />
      {user ? (
        <DashboardWrapper />
      ) : (
        <AuthPage />
      )}
    </>
  );
}
