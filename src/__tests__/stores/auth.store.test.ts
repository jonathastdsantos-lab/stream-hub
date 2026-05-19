import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../lib/stores/auth.store";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset Zustand store state to original default before each test
    useAuthStore.setState({ user: null, tokens: null, status: "idle", error: null });
  });

  it("should initialize with default null state values", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
  });

  it("should successfully set user on setUser call", () => {
    const fakeUser = { id: "fake_user_id", email: "streamer@streamhub.live", name: "Streamer", role: "user", createdAt: "" } as any;
    useAuthStore.getState().setUser(fakeUser);
    expect(useAuthStore.getState().user).toEqual(fakeUser);
  });

  it("should set status on setStatus call", () => {
    useAuthStore.getState().setStatus("loading");
    expect(useAuthStore.getState().status).toBe("loading");
  });

  it("should correctly record error details", () => {
    const errMsg = "Falha crítica de conexão de rede";
    useAuthStore.getState().setError(errMsg);
    expect(useAuthStore.getState().error).toBe(errMsg);
  });

  it("should properly clear auth state on logout", () => {
    const fakeUser = { id: "fake_user_id", email: "streamer@streamhub.live", name: "Streamer", role: "user", createdAt: "" } as any;
    const fakeTokens = { accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 36000 };
    useAuthStore.getState().login(fakeUser, fakeTokens);
    
    expect(useAuthStore.getState().status).toBe("authenticated");

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.status).toBe("unauthenticated");
  });
});
