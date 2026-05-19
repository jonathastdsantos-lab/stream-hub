import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "../../lib/stores/auth.store";

// Mock supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { supabase } from "@/lib/supabase";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset Zustand store state to original default before each test
    useAuthStore.setState({ user: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it("should initialize with default null state values", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should successfully set user on setUser call", () => {
    const fakeUser = { id: "fake_user_id", email: "streamer@streamhub.live", user_metadata: { username: "streamer" } } as any;
    useAuthStore.getState().setUser(fakeUser);
    expect(useAuthStore.getState().user).toEqual(fakeUser);
  });

  it("should set isLoading on setLoading call", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it("should correctly record error details", () => {
    const errMsg = "Erro de autenticação";
    useAuthStore.getState().setError(errMsg);
    expect(useAuthStore.getState().error).toBe(errMsg);
  });

  it("should successfully login user", async () => {
    const fakeUser = { id: "fake_user_id", email: "streamer@streamhub.live" } as any;
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: fakeUser, session: {} as any },
      error: null,
    });

    await useAuthStore.getState().login("streamer@streamhub.live", "password");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should handle login error gracefully", async () => {
    const errorMsg = "Invalid credentials";
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: new Error(errorMsg) as any,
    });

    await expect(
      useAuthStore.getState().login("streamer@streamhub.live", "wrong-password")
    ).rejects.toThrow(errorMsg);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.error).toBe(errorMsg);
    expect(state.isLoading).toBe(false);
  });

  it("should properly clear auth state on logout", async () => {
    const fakeUser = { id: "fake_user_id", email: "streamer@streamhub.live" } as any;
    useAuthStore.setState({ user: fakeUser });

    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
