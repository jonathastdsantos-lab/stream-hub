import { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export function useRtmp() {
  const [rtmpUrl, setRtmpUrl] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateKey(platform: string, userId: string) {
    if (!userId || !platform) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("get-rtmp-key", {
        body: { userId, platform },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data) {
        setRtmpUrl(data.rtmp_url || "");
        setStreamKey(data.stream_key || "");
        toast.success(`Chave RTMP para ${platform.toUpperCase()} obtida com sucesso!`);
        return data;
      }
    } catch (err: any) {
      console.error("[useRtmp] Error generating RTMP key:", err);
      const msg = err.message || "Erro ao gerar chave RTMP.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshKey(platform: string, userId: string) {
    return generateKey(platform, userId);
  }

  function copyToClipboard(text: string, label: string = "Conteúdo") {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência! 📋`);
  }

  function validateKey(key: string): boolean {
    if (!key) return false;
    // Basic verification: stream keys are usually strings with at least 8 characters
    return key.trim().length >= 8;
  }

  return {
    rtmpUrl,
    streamKey,
    isLoading,
    error,
    generateKey,
    refreshKey,
    copyToClipboard,
    validateKey,
  };
}
