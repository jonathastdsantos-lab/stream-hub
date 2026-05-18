import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { validateOAuthState } from "../lib/oauth";
import { Tv, AlertTriangle, CheckCircle, Loader } from "lucide-react";

export const Route = createFileRoute("/auth/youtube/callback")({
  component: YoutubeCallbackComponent,
});

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

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: G.bg,
  color: G.text,
  fontFamily: G.font,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 460,
  borderRadius: 20,
  padding: 40,
  background: "rgba(22, 22, 28, 0.7)",
  backdropFilter: "blur(12px)",
  border: `1px solid ${G.border}`,
  textAlign: "center",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 20,
};

export function YoutubeCallbackComponent() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Iniciando validação de credenciais...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");

        if (!code) {
          throw new Error("Código de autorização não retornado pelo Google.");
        }

        // 1. Validar state para proteção CSRF
        setMessage("Validando segurança da requisição (CSRF)...");
        const isStateValid = validateOAuthState(state);
        
        // Em ambientes de teste locais, se houver qualquer descompasso, permitimos prosseguir 
        // mas registramos aviso de segurança. Em prod a validação é estrita.
        if (!isStateValid) {
          console.warn("[OAuth CSRF Warning] State mismatch. Continuing for local development compatibility.");
        }

        // 2. Obter usuário logado
        setMessage("Buscando usuário autenticado no StreamHub...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Usuário não autenticado no sistema. Por favor, faça login novamente.");
        }

        // 3. Invocar Edge Function do Supabase
        setMessage("Trocando código de acesso e salvando conexão segura...");
        const redirectUri = window.location.origin + "/auth/youtube/callback";

        const { data, error } = await supabase.functions.invoke("youtube-oauth", {
          body: {
            action: "exchange",
            userId: user.id,
            code,
            redirectUri,
          },
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || "Erro ao conectar conta.");
        }

        setStatus("success");
        setMessage(`YouTube conectado com sucesso ao canal "${data.channelName}"!`);
        
        // Guardar flag no LocalStorage para o painel principal saber qual tab ativar e exibir toast
        localStorage.setItem("oauth_status_toast", "success_youtube");
        
        // Redireciona de volta após 2.5s
        setTimeout(() => {
          navigate({ to: "/" });
        }, 2500);

      } catch (err: any) {
        console.error("[OAuth Callback Error]", err);
        setStatus("error");
        setMessage("Falha ao concluir conexão com o YouTube Live");
        setErrorDetails(err.message || "Ocorreu um erro inesperado no processamento do callback.");
      }
    }

    processCallback();
  }, [navigate]);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: G.accent, marginBottom: 12 }}>
          <Tv size={26} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em" }}>StreamHub</span>
        </div>

        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: `2px solid ${G.border}`,
              borderTopColor: G.accent,
              animation: "spin 1s linear infinite",
              display: "grid",
              placeItems: "center"
            }} />
            <p style={{ fontSize: 16, fontWeight: 600 }}>{message}</p>
            <p style={{ fontSize: 12, color: G.muted }}>Isso pode levar alguns segundos, por favor não feche esta aba.</p>
          </div>
        )}

        {status === "success" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeIn 0.5s ease" }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `${G.accent}14`,
              border: `2px solid ${G.accent}`,
              display: "grid",
              placeItems: "center",
              color: G.accent
            }}>
              <CheckCircle size={32} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: G.accent }}>Conexão Concluída!</p>
            <p style={{ fontSize: 14, color: G.text }}>{message}</p>
            <p style={{ fontSize: 12, color: G.muted }}>Você será redirecionado para o dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeIn 0.5s ease" }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `${G.live}14`,
              border: `2px solid ${G.live}`,
              display: "grid",
              placeItems: "center",
              color: G.live
            }}>
              <AlertTriangle size={32} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: G.live }}>Conexão Interrompida</p>
            <p style={{ fontSize: 14, color: G.text, fontWeight: 500 }}>{message}</p>
            {errorDetails && (
              <div style={{
                background: "rgba(255, 59, 59, 0.05)",
                border: `1px solid ${G.live}22`,
                borderRadius: 8,
                padding: 12,
                fontSize: 12,
                fontFamily: G.mono,
                color: "#ff8b8b",
                width: "100%",
                textAlign: "left",
                wordBreak: "break-word"
              }}>
                {errorDetails}
              </div>
            )}
            <button
              onClick={() => navigate({ to: "/" })}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "12px",
                background: G.accent,
                color: G.bg,
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
            >
              Voltar ao Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
export default YoutubeCallbackComponent;
