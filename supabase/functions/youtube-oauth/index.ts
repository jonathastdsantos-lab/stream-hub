/**
 * ═══════════════════════════════════════════════════════════════
 * Supabase Edge Functions — Google OAuth & YouTube Integration
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * ─── HELPER: Trocar authorization code por access e refresh tokens ───
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    console.error("[OAuth] Token exchange failed:", errorData);
    throw new Error(`Google token exchange error: ${errorData.error_description || errorData.error}`);
  }

  return await tokenResponse.json();
}

/**
 * ─── HELPER: Buscar informações do canal YouTube ───
 */
async function getYoutubeChannel(accessToken: string) {
  const channelResponse = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!channelResponse.ok) {
    console.warn("[OAuth] Failed to fetch YouTube channel info:", channelResponse.statusText);
    return null;
  }

  const channelData = await channelResponse.json();
  return channelData.items?.[0] || null;
}

/**
 * ─── HELPER: Renovar Access Token usando Refresh Token ───
 */
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[OAuth] Refresh token exchange failed:", errorData);
    throw new Error(`Google token refresh error: ${errorData.error_description || errorData.error}`);
  }

  return await response.json();
}

/**
 * ═══════════════════════════════════════════════════════════════
 * DENO SERVE
 * ═══════════════════════════════════════════════════════════════
 */
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userId, code, redirectUri, platform } = await req.json();

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Credenciais do Google não configuradas nas Edge Functions (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)");
    }

    // 1. AÇÃO: Trocar o código de autorização do Google por tokens e persistir no Supabase
    if (action === "exchange") {
      if (!userId || !code || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "Parâmetros 'userId', 'code' e 'redirectUri' são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[OAuth] Trocando código para o usuário: ${userId}`);
      const tokens = await exchangeCodeForTokens(code, redirectUri, clientId, clientSecret);
      
      // Buscar dados do canal YouTube
      let channelName = "YouTube Live Stream";
      let channelId = `yt_${Math.random().toString(36).substring(2, 10)}`;
      
      const channel = await getYoutubeChannel(tokens.access_token);
      if (channel) {
        channelName = channel.snippet.title;
        channelId = channel.id;
        console.log(`[OAuth] Canal encontrado: ${channelName} (${channelId})`);
      } else {
        console.warn("[OAuth] Não foi possível carregar os dados reais do canal. Usando fallback.");
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Salva no platform_connections
      const { error: upsertError } = await supabase.from("platform_connections").upsert(
        {
          user_id: userId,
          platform: "youtube",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || undefined, // Evita deletar se vier nulo na renovação
          expires_at: expiresAt.toISOString(),
          channel_id: channelId,
          channel_name: channelName,
          is_active: true,
          connected_at: new Date().toISOString(),
          rtmp_url: "rtmp://a.rtmp.youtube.com/live2",
          stream_key: `live_${userId.substring(0, 8)}_youtube_${Math.random().toString(36).substring(2, 10)}`
        },
        { onConflict: "user_id,platform" }
      );

      if (upsertError) {
        throw new Error(`Erro ao salvar no Supabase: ${upsertError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, channelName, channelId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. AÇÃO: Renovar o token de acesso de um usuário específico
    if (action === "refresh") {
      if (!userId || !platform) {
        return new Response(
          JSON.stringify({ error: "Parâmetros 'userId' e 'platform' são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: conn, error: connError } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", platform)
        .maybeSingle();

      if (connError || !conn) {
        return new Response(
          JSON.stringify({ error: "Conexão da plataforma não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!conn.refresh_token) {
        return new Response(
          JSON.stringify({ error: "Refresh token não disponível para esta conexão" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[OAuth] Renovando token para o usuário: ${userId}`);
      const newTokens = await refreshAccessToken(conn.refresh_token, clientId, clientSecret);
      const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

      const { error: updateError } = await supabase
        .from("platform_connections")
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token || conn.refresh_token,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .eq("user_id", userId)
        .eq("platform", platform);

      if (updateError) {
        throw new Error(`Erro ao atualizar tokens no Supabase: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, expiresAt }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. AÇÃO: Cron job de renovação em lote de tokens expirados
    if (action === "cron-refresh") {
      console.log("[Cron] Iniciando renovação em lote de tokens expirados...");

      const now = new Date().toISOString();
      const { data: expiredConns, error: fetchError } = await supabase
        .from("platform_connections")
        .select("user_id, platform, refresh_token")
        .eq("platform", "youtube")
        .lt("expires_at", now);

      if (fetchError) {
        throw new Error(`Erro ao buscar conexões expiradas: ${fetchError.message}`);
      }

      if (!expiredConns || expiredConns.length === 0) {
        return new Response(
          JSON.stringify({ success: true, refreshed: 0, message: "Nenhum token expirado encontrado" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Cron] Encontrados ${expiredConns.length} tokens expirados.`);
      let refreshedCount = 0;
      let failedCount = 0;

      for (const conn of expiredConns) {
        if (!conn.refresh_token) {
          console.warn(`[Cron] Sem refresh token para usuário ${conn.user_id}`);
          failedCount++;
          continue;
        }

        try {
          const newTokens = await refreshAccessToken(conn.refresh_token, clientId, clientSecret);
          const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

          await supabase
            .from("platform_connections")
            .update({
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token || conn.refresh_token,
              expires_at: expiresAt.toISOString(),
              is_active: true
            })
            .eq("user_id", conn.user_id)
            .eq("platform", "youtube");

          refreshedCount++;
        } catch (err) {
          console.error(`[Cron] Falha ao renovar para usuário ${conn.user_id}:`, err.message);
          // Marca conexão como inativa para feedback visual
          await supabase
            .from("platform_connections")
            .update({ is_active: false })
            .eq("user_id", conn.user_id)
            .eq("platform", "youtube");
          failedCount++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, refreshed: refreshedCount, failed: failedCount }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação não suportada" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[OAuth] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno na Edge Function" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
