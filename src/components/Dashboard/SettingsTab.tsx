import React from "react";
import { LogOut } from "lucide-react";
import { G } from "./constants";

interface SettingsTabProps {
  displayName: string;
  setDisplayName: (name: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  plan: string;
  setPlan: (plan: string) => void;
  saveProfile: () => void;
  isSavingProfile: boolean;
  user: any;
  onLogout: () => void;
}

export function SettingsTab({
  displayName,
  setDisplayName,
  bio,
  setBio,
  plan,
  setPlan,
  saveProfile,
  isSavingProfile,
  user,
  onLogout,
}: SettingsTabProps) {
  return (
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
  );
}
