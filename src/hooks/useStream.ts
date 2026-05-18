import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useStreamStore } from "../lib/stores/stream.store";
import { toast } from "sonner";

export function useStream(userId?: string) {
  const {
    currentStream,
    isLive,
    viewers,
    duration,
    streamHistory,
    setStream,
    setLive,
    setViewers,
    setDuration,
    setStreamHistory,
    clearStream,
  } = useStreamStore();

  // 1. Initial active stream recovery check
  useEffect(() => {
    if (!userId) return;

    async function recoveryActiveStream() {
      const { data: streams, error: streamErr } = await supabase
        .from("streams")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "live")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!streamErr && streams && streams.length > 0) {
        const stream = streams[0];
        setStream(stream);
        setLive(true);
        setViewers(stream.peak_viewers || 15);
        const start = new Date(stream.started_at).getTime();
        setDuration(Math.floor((Date.now() - start) / 1000));
      }
    }

    recoveryActiveStream();
  }, [userId]);

  // 2. Load stream history
  async function loadStreamHistory() {
    if (!userId) return;
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "ended")
      .order("created_at", { descending: true });

    if (!error && data) {
      setStreamHistory(data);
    }
  }

  // Load history initially and when live status changes
  useEffect(() => {
    if (userId) {
      loadStreamHistory();
    }
  }, [userId, isLive]);

  // 3. Live session duration and viewer counter simulation
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isLive && currentStream) {
      timer = setInterval(() => {
        setDuration((d) => d + 1);
        setViewers((v) => Math.max(5, v + Math.floor(Math.random() * 11) - 5));
      }, 1000);
    } else {
      setDuration(0);
      setViewers(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLive, currentStream]);

  async function startStream(activePlatforms: string[], displayName: string, email: string) {
    if (!userId) return;
    if (activePlatforms.length === 0) {
      toast.warning("Para iniciar a live, você precisa ter pelo menos uma plataforma ativada nas conexões!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("streams")
        .insert({
          user_id: userId,
          title: `Stream Ao Vivo — ${displayName || email.split("@")[0]}`,
          status: "live",
          platforms: activePlatforms,
          started_at: new Date().toISOString(),
          peak_viewers: Math.floor(Math.random() * 40) + 15,
        })
        .select()
        .single();

      if (error) throw error;

      setStream(data);
      setLive(true);
      toast.success("Transmissão iniciada em todas as plataformas selecionadas!");
      return data;
    } catch (e: any) {
      toast.error("Erro ao iniciar a live: " + e.message);
      throw e;
    }
  }

  async function endStream() {
    if (!currentStream) return;

    try {
      const { error } = await supabase
        .from("streams")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          peak_viewers: viewers,
        })
        .eq("id", currentStream.id);

      if (error) throw error;

      clearStream();
      toast.success("Transmissão encerrada! Histórico salvo.");
      await loadStreamHistory();
    } catch (e: any) {
      toast.error("Erro ao encerrar a live: " + e.message);
      throw e;
    }
  }

  return {
    currentStream,
    isLive,
    viewers,
    duration,
    streamHistory,
    startStream,
    endStream,
    loadStreamHistory,
  };
}
