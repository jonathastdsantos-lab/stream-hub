import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useChatStore, ChatMsg, PlatformId } from "../lib/stores/chat.store";
import { toast } from "sonner";

export function useChat(streamId?: string, isLive?: boolean) {
  const {
    messages,
    chatFilter,
    addMessage,
    setMessages,
    setFilter,
    clearMessages,
  } = useChatStore();

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

  // Fetch initial chat logs and subscribe to realtime events
  useEffect(() => {
    if (!streamId) {
      clearMessages();
      return;
    }

    async function loadChatMessages() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const msgs: ChatMsg[] = data.map((msg: any) => ({
          user: msg.username,
          msg: msg.message,
          platform: msg.platform as PlatformId,
          time: new Date(msg.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(msgs);
      }
    }

    loadChatMessages();

    // Subscribe to messages
    const chatChannel = supabase
      .channel(`chat_${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `stream_id=eq.${streamId}`,
        },
        (payload: any) => {
          const newMsg: ChatMsg = {
            user: payload.new.username,
            msg: payload.new.message,
            platform: payload.new.platform as PlatformId,
            time: new Date(payload.new.created_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          addMessage(newMsg);
        }
      )
      .subscribe();

    // Subscribe to alerts
    const alertsChannel = supabase
      .channel(`alerts_${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_alerts",
          filter: `stream_id=eq.${streamId}`,
        },
        (payload: any) => {
          const alert = payload.new;
          toast.custom(
            (t) => (
              <div
                className="glass"
                style={{
                  borderRadius: 14,
                  padding: "16px 22px",
                  color: "#e8e8f2",
                  fontFamily: "'Syne', 'Space Grotesk', sans-serif",
                  boxShadow: `0 8px 30px rgba(0, 240, 181, 0.3)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minWidth: 320,
                  border: `1.5px solid #00f0b5`,
                  background: "linear-gradient(135deg, #16161c 0%, #0d0d12 100%)",
                  animation: "slideIn .35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      color: "#00f0b5",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    ⭐ NOVO ALERTA — {alert.platform.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>
                  {alert.username} <span style={{ color: "#00f0b5" }}>{alertTypeLabel(alert.type)}</span>
                </p>
                {alert.amount && (
                  <p style={{ fontSize: 20, color: "#fff", fontWeight: 900, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", margin: "2px 0" }}>
                    {alert.currency === "BRL" ? "R$ " : "$"}
                    {Number(alert.amount).toFixed(2)}
                  </p>
                )}
                {alert.message && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#75758c",
                      fontStyle: "italic",
                      background: "#1c1c24",
                      padding: "6px 10px",
                      borderRadius: 6,
                      borderLeft: `3px solid #00f0b5`,
                      marginTop: 6,
                    }}
                  >
                    "{alert.message}"
                  </p>
                )}
              </div>
            ),
            {
              duration: 6000,
              position: "top-right",
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [streamId]);

  async function sendMessage(text: string, username: string, platform: PlatformId) {
    if (!text.trim()) return;
    if (!streamId) {
      toast.warning("Inicie a transmissão para poder interagir no chat!");
      return;
    }

    try {
      const { error } = await supabase.from("chat_messages").insert({
        stream_id: streamId,
        platform: platform,
        username: username,
        message: text.trim(),
        is_mod: true,
      });

      if (error) throw error;
    } catch (e: any) {
      toast.error("Erro ao enviar chat: " + e.message);
      throw e;
    }
  }

  async function simulateAlert(platform: PlatformId) {
    if (!streamId) {
      toast.warning("Apenas transmissões ativas podem receber alertas! Inicie a live.");
      return;
    }

    const types = ["donation", "subscription", "follow", "bits"];
    const type = types[Math.floor(Math.random() * types.length)];
    const users = ["alvaro_br", "marcia_live", "stream_watcher", "gustavo_10", "ana_gameplay"];
    const username = users[Math.floor(Math.random() * users.length)];
    const messagesPool = ["Excelente conteúdo, parabéns!", "Mais um sub pro canal!", "Manda salve!", "Faz o clipe dessa jogada!!"];
    const message = messagesPool[Math.floor(Math.random() * messagesPool.length)];
    const amount = type === "donation" ? (Math.random() * 95 + 5).toFixed(2) : null;

    try {
      const { error } = await supabase.from("stream_alerts").insert({
        stream_id: streamId,
        type: type,
        platform: platform,
        username: username,
        amount: amount ? parseFloat(amount) : null,
        currency: "BRL",
        message: type === "follow" ? null : message,
        shown: false,
      });

      if (error) throw error;
      toast.success("Alerta inserido no banco de dados com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao simular alerta: " + e.message);
      throw e;
    }
  }

  const filteredChat = messages.filter(
    (m) => chatFilter === "all" || m.platform === chatFilter
  );

  return {
    messages: filteredChat,
    allMessages: messages,
    chatFilter,
    setFilter,
    sendMessage,
    simulateAlert,
    clearMessages,
  };
}
