/**
 * ═══════════════════════════════════════════════════════════════
 * Google OAuth Helper — CSRF State & URL Generation
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Gerar state aleatório para proteção contra ataques CSRF
 */
export function generateRandomState(): string {
  const array = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback se rodando no SSR
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Monta a URL de redirecionamento do Google OAuth 2.0
 */
export function getGoogleOAuthUrl(redirectUri: string): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";
  
  // Gerar e salvar state no LocalStorage para validação futura
  const state = generateRandomState();
  if (typeof window !== "undefined") {
    localStorage.setItem("oauth_state_youtube", state);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
    access_type: "offline", // Importante: Garante o envio do Refresh Token no primeiro login
    prompt: "consent", // Força o consentimento para sempre retornar o refresh token
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Valida o estado recebido do OAuth para proteção CSRF
 */
export function validateOAuthState(state: string | null): boolean {
  if (!state || typeof window === "undefined") return false;
  const storedState = localStorage.getItem("oauth_state_youtube");
  localStorage.removeItem("oauth_state_youtube"); // Consome o state imediatamente
  return state === storedState;
}
