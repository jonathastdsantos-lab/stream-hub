import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../lib/stores/auth.store";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useAuthStore.getState().clearAuth();
  });

  it("should initialize with default null state values", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should successfully set user on setUser call", () => {
    const fakeUser = { id: "fake_user_id", email: "streamer@streamhub.live" } as any;
    useAuthStore.getState().setUser(fakeUser);
    expect(useAuthStore.getState().user).toEqual(fakeUser);
  });

  it("should successfully set profile on setProfile call", () => {
    const fakeProfile = { display_name: "Antigravity Streamer", bio: "Gamer Elite" };
    useAuthStore.getState().setProfile(fakeProfile);
    expect(useAuthStore.getState().profile).toEqual(fakeProfile);
  });

  it("should toggle isLoading state", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("should correctly record error details", () => {
    const errMsg = "Falha crítica de conexão de rede";
    useAuthStore.getState().setError(errMsg);
    expect(useAuthStore.getState().error).toBe(errMsg);
  });

  it("should properly clear authentication state on clearAuth", () => {
    useAuthStore.getState().setUser({ id: "user_id" } as any);
    useAuthStore.getState().setProfile({ username: "gaming" });
    useAuthStore.getState().setError("Some error");
    useAuthStore.getState().setLoading(true);

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
