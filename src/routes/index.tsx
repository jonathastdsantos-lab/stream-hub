import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import { 
  Tv, 
  MessageSquare, 
  Settings, 
  Activity, 
  LayoutDashboard, 
  Copy, 
  Check, 
  Play, 
  Square, 
  LogOut, 
  Key, 
  Globe, 
  Sparkles, 
  User as UserIcon, 
  Info,
  Radio,
  Wifi,
  History,
  Eye,
  Send,
  Zap,
  UserCheck
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer 
} from "recharts";

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

const pColor = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)?.color ?? "#888";

const G = {
  bg: "#08080c",
  surface: "#111115",
  card: "#16161c",
  border: "#24242e",
  text: "#e8e8f2",
  muted: "#75758c",
  accent: "#00f0b5",
  live: "#ff3b3b",
  font: "'Syne', 'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

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

const Tag = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "3px 8px",
      borderRadius: 4,
      background: `${color}18`,
      color,
      border: `0.5px solid ${color}44`,
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
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: any;
}) => (
  <div
    className="glass"
    style={{
      borderRadius: 14,
      padding: 20,
      animation: "fadeIn .45s ease",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
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
      {Icon && <Icon size={16} style={{ color: color ?? G.muted }} />}
    </div>
    <div
      style={{
        fontSize: 30,
        fontWeight: 700,
        marginTop: 10,
        color: color ?? G.text,
        fontFamily: G.mono,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
    {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 6 }}>{sub}</div>}
  </div>
);

function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const submit = async () => {
    if (!email || !pass || (tab === "register" && !name)) {
      setErr("Preencha todos os campos obrigatórios.");
      return;
    }
    setErr("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (tab === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              username: name.trim().toLowerCase().replace(/\s+/g, "_"),
              full_name: name,
            }
          }
        });
        if (error) throw error;
        setSuccessMsg("Conta criada! Por favor, faça login.");
        setTab("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setErr(error.message || "Erro de autenticação.");
    } finally {
      setLoading(false);
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
                setErr("");
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
          
          {err && (
            <p style={{ color: G.live, fontSize: 13, fontWeight: 600, animation: "slideIn .2s ease" }}>
              ⚠️ {err}
            </p>
          )}
          {successMsg && (
            <p style={{ color: G.accent, fontSize: 13, fontWeight: 600, animation: "slideIn .2s ease" }}>
              ✅ {successMsg}
            </p>
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
              <>Entrar no StreamHub</>
            ) : (
              <>Criar Canal Agora</>
            )}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: G.muted, marginTop: 24, lineHeight: "1.4" }}>
          Ao criar uma conta ou fazer login, você concorda com nossos termos de privacidade e serviço de transmissão multicanais.
        </p>
      </div>
    </div>
  );
}

const NAVITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "stream", icon: Radio, label: "Ao vivo" },
  { id: "chat", icon: MessageSquare, label: "Chat completo" },
  { id: "platforms", icon: Globe, label: "Plataformas" },
  { id: "analytics", icon: Activity, label: "Analytics" },
  { id: "settings", icon: Settings, label: "Configurações" },
];

function Sidebar({
  active,
  onNav,
  userName,
  live,
  plan,
  avatarLetter,
}: {
  active: string;
  onNav: (id: string) => void;
  userName: string;
  live: boolean;
  plan: string;
  avatarLetter: string;
}) {
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

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [nav, setNav] = useState("dashboard");
  const [live, setLive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Supabase states
  const [profile, setProfile] = useState<any>(null);
  const [connected, setConnected] = useState<Record<PlatformId, boolean>>({
    youtube: false,
    twitch: false,
    kick: false,
    tiktok: false,
    facebook: false,
  });
  const [platformDetails, setPlatformDetails] = useState<Record<PlatformId, any>>({});
  const [activeStream, setActiveStream] = useState<any>(null);
  const [streamHistory, setStreamHistory] = useState<any[]>([]);

  // Settings State
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [plan, setPlan] = useState("free");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Chat/Alert variables
  const [chatFilter, setChatFilter] = useState<string>("all");

  const alertTypeLabel = (type: string) => {
    switch (type) {
      case "donation": return "doou!";
      case "subscription": return "se inscreveu!";
      case "follow": return "seguiu o canal!";
      case "raid": return "está fazendo uma raid!";
      case "bits": return "enviou bits!";
      default: return "interagiu!";
    }
  };

  // 1. Load profile and load connections on start
  useEffect(() => {
    async function loadData() {
      // Get profile
      let { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profErr || !prof) {
        // Trigger auto-creation profile check
        // wait 1 second and retry just in case DB trigger is working
        await new Promise(r => setTimeout(r, 1000));
        const retry = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!retry.error && retry.data) {
          prof = retry.data;
        } else {
          // Local fallback
          prof = {
            username: user.email?.split("@")[0] || "streamer",
            display_name: user.email?.split("@")[0] || "Streamer",
            avatar_url: null,
            bio: "",
            plan: "free",
          };
        }
      }

      setProfile(prof);
      setDisplayName(prof.display_name || "");
      setBio(prof.bio || "");
      setPlan(prof.plan || "free");

      // Load platform connections
      const { data: conns, error: connErr } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("user_id", user.id);

      if (!connErr && conns) {
        const connState: Record<PlatformId, boolean> = {
          youtube: false,
          twitch: false,
          kick: false,
          tiktok: false,
          facebook: false,
        };
        const details: Record<PlatformId, any> = {};
        
        conns.forEach((conn: any) => {
          if (conn.platform in connState) {
            connState[conn.platform as PlatformId] = conn.is_active;
            details[conn.platform as PlatformId] = conn;
          }
        });
        
        setConnected(connState);
        setPlatformDetails(details);
      }

      // Check active stream
      const { data: streams, error: streamErr } = await supabase
        .from("streams")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "live")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!streamErr && streams && streams.length > 0) {
        const stream = streams[0];
        setActiveStream(stream);
        setLive(true);
        setViewers(stream.peak_viewers || 15);
        const start = new Date(stream.started_at).getTime();
        setDuration(Math.floor((Date.now() - start) / 1000));
      }
    }

    loadData();
  }, [user.id]);

  // Load stream history
  useEffect(() => {
    async function loadHistory() {
      const { data, error } = await supabase
        .from("streams")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ended")
        .order("created_at", { descending: true });
        
      if (!error && data) {
        setStreamHistory(data);
      }
    }
    if (user.id) {
      loadHistory();
    }
  }, [user.id, live]);

  // Duration timer
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    if (live && activeStream) {
      t = setInterval(() => {
        setDuration((d) => d + 1);
        setViewers((v) => Math.max(5, v + Math.floor(Math.random() * 11) - 5));
      }, 1000);
    } else {
      setDuration(0);
      setViewers(0);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [live, activeStream]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatLog]);

  // Realtime subscription for Chat and Alerts
  useEffect(() => {
    if (!activeStream) {
      setChatLog([]);
      return;
    }

    // Load initial chat
    async function loadChatMessages() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("stream_id", activeStream.id)
        .order("created_at", { ascending: true });
        
      if (!error && data) {
        const msgs: ChatMsg[] = data.map((msg: any) => ({
          user: msg.username,
          msg: msg.message,
          platform: msg.platform as PlatformId,
          time: new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }));
        setChatLog(msgs);
      }
    }
    
    loadChatMessages();

    // Subscribe to messages
    const chatChannel = supabase
      .channel(`chat_${activeStream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `stream_id=eq.${activeStream.id}`,
        },
        (payload: any) => {
          const newMsg: ChatMsg = {
            user: payload.new.username,
            msg: payload.new.message,
            platform: payload.new.platform as PlatformId,
            time: new Date(payload.new.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          };
          setChatLog((log) => [...log, newMsg]);
        }
      )
      .subscribe();

    // Subscribe to alerts
    const alertsChannel = supabase
      .channel(`alerts_${activeStream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_alerts",
          filter: `stream_id=eq.${activeStream.id}`,
        },
        (payload: any) => {
          const alert = payload.new;
          toast.custom((t) => (
            <div
              className="glass"
              style={{
                borderRadius: 14,
                padding: "16px 22px",
                color: G.text,
                fontFamily: G.font,
                boxShadow: `0 8px 30px rgba(0, 240, 181, 0.3)`,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minWidth: 320,
                border: `1.5px solid ${G.accent}`,
                background: "linear-gradient(135deg, #16161c 0%, #0d0d12 100%)",
                animation: "slideIn .35s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: G.accent,
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  <Zap size={10} /> NOVO ALERTA — {alert.platform.toUpperCase()}
                </span>
                <span style={{ fontSize: 14 }}>⭐</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>
                {alert.username} <span style={{ color: G.accent }}>{alertTypeLabel(alert.type)}</span>
              </p>
              {alert.amount && (
                <p style={{ fontSize: 20, color: "#fff", fontWeight: 900, fontFamily: G.mono, margin: "2px 0" }}>
                  {alert.currency === "BRL" ? "R$ " : "$"}
                  {Number(alert.amount).toFixed(2)}
                </p>
              )}
              {alert.message && (
                <p style={{ 
                  fontSize: 12, 
                  color: G.muted, 
                  fontStyle: "italic", 
                  background: "#1c1c24",
                  padding: "6px 10px", 
                  borderRadius: 6,
                  borderLeft: `3px solid ${G.accent}`,
                  marginTop: 6 
                }}>
                  "{alert.message}"
                </p>
              )}
            </div>
          ), {
            duration: 6000,
            position: "top-right"
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [activeStream]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const connCount = Object.values(connected).filter(Boolean).length;

  // Actions
  const togglePlatform = async (platform: PlatformId) => {
    const isCurrentlyConnected = connected[platform];
    
    try {
      if (isCurrentlyConnected) {
        const { error } = await supabase
          .from("platform_connections")
          .delete()
          .eq("user_id", user.id)
          .eq("platform", platform);
        
        if (error) throw error;
        
        setConnected((c) => ({ ...c, [platform]: false }));
        toast.success(`Plataforma ${platform.toUpperCase()} desconectada!`);
      } else {
        const dummyKey = `live_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 10)}`;
        const dummyRtmp = `rtmp://rtmp.${platform}.com/live2`;
        const channelName = `${profile?.display_name || user.email?.split("@")[0]} Live`;

        const { error, data } = await supabase
          .from("platform_connections")
          .insert({
            user_id: user.id,
            platform: platform,
            stream_key: dummyKey,
            rtmp_url: dummyRtmp,
            channel_name: channelName,
            channel_id: `ch_${Math.random().toString(36).substring(2, 8)}`,
            is_active: true,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setConnected((c) => ({ ...c, [platform]: true }));
        setPlatformDetails((prev) => ({ ...prev, [platform]: data }));
        toast.success(`Plataforma ${platform.toUpperCase()} conectada!`);
      }
    } catch (e: any) {
      toast.error(e.message || `Erro ao alterar conexão da plataforma ${platform}`);
    }
  };

  const startStream = async () => {
    const activePlatforms = Object.keys(connected).filter(
      (k) => connected[k as PlatformId]
    );
    
    if (activePlatforms.length === 0) {
      toast.warning("Para iniciar a live, você precisa ter pelo menos uma plataforma ativada nas conexões!");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("streams")
        .insert({
          user_id: user.id,
          title: `Stream Ao Vivo — ${profile?.display_name || user.email?.split("@")[0]}`,
          status: "live",
          platforms: activePlatforms,
          started_at: new Date().toISOString(),
          peak_viewers: Math.floor(Math.random() * 40) + 15,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setActiveStream(data);
      setLive(true);
      toast.success("Transmissão iniciada em todas as plataformas selecionadas!");
    } catch (e: any) {
      toast.error("Erro ao iniciar a live: " + e.message);
    }
  };

  const endStream = async () => {
    if (!activeStream) return;
    
    try {
      const { error } = await supabase
        .from("streams")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          peak_viewers: viewers,
        })
        .eq("id", activeStream.id);
        
      if (error) throw error;
      
      setLive(false);
      setActiveStream(null);
      setDuration(0);
      setViewers(0);
      toast.success("Transmissão encerrada! Histórico salvo.");
    } catch (e: any) {
      toast.error("Erro ao encerrar a live: " + e.message);
    }
  };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    
    if (!activeStream) {
      toast.warning("Inicie a transmissão para poder interagir no chat!");
      return;
    }
    
    const activePlatforms = Object.keys(connected).filter((k) => connected[k as PlatformId]) as PlatformId[];
    const platform = activePlatforms.length > 0 ? activePlatforms[0] : "twitch";
    
    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          stream_id: activeStream.id,
          platform: platform,
          username: profile?.display_name || user.email?.split("@")[0] || "streamer",
          message: chatMsg.trim(),
          is_mod: true,
        });
        
      if (error) throw error;
      setChatMsg("");
    } catch (e: any) {
      toast.error("Erro ao enviar chat: " + e.message);
    }
  };

  const simulateAlert = async () => {
    if (!activeStream) {
      toast.warning("Apenas transmissões ativas podem receber alertas! Inicie a live.");
      return;
    }
    
    const types = ["donation", "subscription", "follow", "bits"];
    const type = types[Math.floor(Math.random() * types.length)];
    const users = ["alvaro_br", "marcia_live", "stream_watcher", "gustavo_10", "ana_gameplay"];
    const username = users[Math.floor(Math.random() * users.length)];
    const messages = ["Excelente conteúdo, parabéns!", "Mais um sub pro canal!", "Manda salve!", "Faz o clipe dessa jogada!!"];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const amount = type === "donation" ? (Math.random() * 95 + 5).toFixed(2) : null;
    
    const activePlatforms = Object.keys(connected).filter((k) => connected[k as PlatformId]) as PlatformId[];
    const platform = activePlatforms.length > 0 ? activePlatforms[0] : "twitch";

    try {
      const { error } = await supabase
        .from("stream_alerts")
        .insert({
          stream_id: activeStream.id,
          type: type,
          platform: platform,
          username: username,
          amount: amount ? parseFloat(amount) : null,
          currency: "BRL",
          message: type === "follow" ? null : message,
          shown: false
        });
        
      if (error) throw error;
      toast.success("Alerta inserido no banco de dados com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao simular alerta: " + e.message);
    }
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
          plan: plan,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setProfile((prev: any) => ({ ...prev, display_name: displayName, bio, plan }));
      toast.success("Perfil e configurações salvos com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar perfil: " + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Filtered Chat Msg
  const filteredChat = chatLog.filter(m => chatFilter === "all" || m.platform === chatFilter);

  // Mock analytics data for visual feedback (can combine with history if empty)
  const analyticsData = [
    { name: "Live 1", viewers: 24, chatMsgs: 120 },
    { name: "Live 2", viewers: 45, chatMsgs: 180 },
    { name: "Live 3", viewers: 35, chatMsgs: 140 },
    { name: "Live 4", viewers: 68, chatMsgs: 310 },
    { name: "Atual", viewers: viewers > 0 ? viewers : 0, chatMsgs: chatLog.length },
  ];

  const panels: Record<string, React.ReactNode> = {
    dashboard: (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
              Canal de {profile?.display_name || user.email?.split("@")[0]} 🚀
            </h1>
            <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
              Transmita simultaneamente para todas as suas redes de forma centralizada!
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {live && (
              <button
                onClick={simulateAlert}
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
              onClick={live ? endStream : startStream}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: live ? G.live : `linear-gradient(135deg, ${G.accent} 0%, #00d29d 100%)`,
                color: live ? "#fff" : G.bg,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: G.font,
                letterSpacing: "0.02em",
                boxShadow: live ? `0 0 20px ${G.live}44` : `0 0 20px ${G.accent}44`,
                transition: "all .2s ease-in-out",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {live ? (
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
          <StatCard label="Status do Servidor" value={live ? "AO VIVO" : "Offline"} color={live ? G.live : G.muted} icon={Wifi} sub={live ? "servidor RTMP conectado" : "pronto para iniciar"} />
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
                    onClick={() => togglePlatform(p.id)}
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
                {chatLog.length === 0 ? (
                  <div style={{ flex: 1, display: "grid", placeItems: "center", color: G.muted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                    <div>
                      <MessageSquare size={36} style={{ color: G.border, marginBottom: 10 }} />
                      <p>O chat está vazio.</p>
                      <p style={{ fontSize: 11, marginTop: 4 }}>Inicie a live e envie uma mensagem para testar a sincronização!</p>
                    </div>
                  </div>
                ) : (
                  chatLog.map((m, i) => (
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
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder={live ? "Escreva sua resposta..." : "Inicie a transmissão para poder digitar no chat..."}
                  disabled={!live}
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
                  onClick={sendChat}
                  disabled={!live || !chatMsg.trim()}
                  style={{
                    padding: "0 22px",
                    borderRadius: 10,
                    border: "none",
                    background: live && chatMsg.trim() ? G.accent : G.border,
                    color: live && chatMsg.trim() ? G.bg : G.muted,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: live && chatMsg.trim() ? "pointer" : "default",
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
      <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
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
      </div>
    ),

    chat: (
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
            {["all", ...Object.keys(connected).filter(k => connected[k as PlatformId])].map((f) => (
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
    ),

    platforms: (
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
    ),

    analytics: (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Estatísticas e Analytics do Canal
          </h1>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
            Análise em tempo real do engajamento dos seus espectadores e histórico de transmissões passadas.
          </p>
        </div>

        {/* Graphics Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          <div className="glass" style={{ borderRadius: 16, padding: 24, minHeight: 320 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted, marginBottom: 18 }}>
              Evolução de Visualizações (Últimas Transmissões)
            </h3>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={G.accent} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={G.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
                  <XAxis dataKey="name" stroke={G.muted} fontSize={11} />
                  <YAxis stroke={G.muted} fontSize={11} />
                  <ChartTooltip 
                    contentStyle={{ 
                      background: G.card, 
                      border: `1px solid ${G.border}`, 
                      borderRadius: 8,
                      color: G.text,
                      fontFamily: G.font
                    }} 
                  />
                  <Area type="monotone" dataKey="viewers" stroke={G.accent} strokeWidth={2} fillOpacity={1} fill="url(#colorViewers)" name="Espectadores" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* History section */}
        <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <History size={14} /> Histórico de Transmissões Recentes (Salvo no Supabase)
          </h3>
          {streamHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: G.muted, fontSize: 13 }}>
              Nenhuma live finalizada no histórico do banco de dados.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {streamHistory.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: 10,
                    background: "rgba(28, 28, 36, 0.3)",
                    border: `1px solid ${G.border}`,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, color: G.text }}>{s.title}</p>
                    <p style={{ color: G.muted, fontSize: 11, marginTop: 3 }}>
                      Iniciada em: {new Date(s.started_at).toLocaleString("pt-BR")} • Finalizada em: {s.ended_at ? new Date(s.ended_at).toLocaleTimeString("pt-BR") : "N/A"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Tag color={G.accent}>Pico: {s.peak_viewers} visualizações</Tag>
                    <span style={{ fontSize: 10, color: G.muted, fontFamily: G.mono }}>
                      {s.platforms?.join(", ").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),

    settings: (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s ease" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Configurações da Conta e Canal
          </h1>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>
            Atualize as informações do seu canal, biografia, nível de assinatura ou efetue logout.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, flexWrap: "wrap" }}>
          {/* Edit profile form */}
          <div className="glass" style={{ borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted }}>
              Editar Perfil do Streamer
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Nome do Canal (Exibição)
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "#16161d",
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    fontSize: 13,
                    outline: "none",
                    fontFamily: G.font
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Biografia / Descrição do Canal
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escreva sobre o seu canal de streaming..."
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "#16161d",
                    border: `1px solid ${G.border}`,
                    color: G.text,
                    fontSize: 13,
                    outline: "none",
                    fontFamily: G.font,
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Plano StreamHub
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {["free", "pro", "studio"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      style={{
                        padding: "10px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12.5,
                        textTransform: "uppercase",
                        cursor: "pointer",
                        border: plan === p ? `1.5px solid ${G.accent}` : `1px solid ${G.border}`,
                        background: plan === p ? `${G.accent}14` : "rgba(22, 22, 28, 0.4)",
                        color: plan === p ? G.accent : G.muted,
                        transition: "all .2s"
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={isSavingProfile}
              style={{
                padding: "12px",
                borderRadius: 8,
                border: "none",
                background: G.accent,
                color: G.bg,
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                fontFamily: G.font,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity .15s"
              }}
            >
              {isSavingProfile ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: `2px solid ${G.bg}`,
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                  }}
                />
              ) : (
                <>Salvar Configurações</>
              )}
            </button>
          </div>

          {/* Account status & info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass" style={{ borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: G.muted }}>
                Informações de Registro
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: G.muted }}>Seu Email:</span>
                  <p style={{ fontWeight: 600, color: G.text, marginTop: 2 }}>{user.email}</p>
                </div>
                <div>
                  <span style={{ color: G.muted }}>ID do Usuário:</span>
                  <p style={{ fontFamily: G.mono, fontSize: 10, color: G.text, marginTop: 2, wordBreak: "break-all" }}>{user.id}</p>
                </div>
                <div>
                  <span style={{ color: G.muted }}>Último Acesso:</span>
                  <p style={{ fontWeight: 600, color: G.text, marginTop: 2 }}>{new Date(user.last_sign_in_at || "").toLocaleString("pt-BR")}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: `1.5px solid ${G.live}66`,
                background: "transparent",
                color: G.live,
                fontWeight: 750,
                fontSize: 13.5,
                cursor: "pointer",
                fontFamily: G.font,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all .2s",
              }}
            >
              <LogOut size={14} /> Sair do StreamHub
            </button>
          </div>
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
      <Sidebar 
        active={nav} 
        onNav={setNav} 
        userName={profile?.display_name || user.email?.split("@")[0] || "Streamer"} 
        live={live} 
        plan={profile?.plan || "free"}
        avatarLetter={(profile?.display_name?.[0] || user.email?.[0] || "S").toUpperCase()}
      />
      <main style={{ flex: 1, padding: "36px 40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {panel}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
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
        <Dashboard user={user} onLogout={() => supabase.auth.signOut()} />
      ) : (
        <AuthPage />
      )}
    </>
  );
}
