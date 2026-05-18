import React from "react";
import { History } from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  Area 
} from "recharts";
import { G } from "./constants";

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

interface AnalyticsTabProps {
  analyticsData: any[];
  streamHistory: any[];
}

export function AnalyticsTab({
  analyticsData,
  streamHistory,
}: AnalyticsTabProps) {
  return (
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
  );
}
