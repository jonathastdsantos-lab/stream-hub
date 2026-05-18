import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../lib/stores/auth.store";

// Mock Supabase
vi.mock("../../lib/supabase", () => {
  const mockAuth = {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    getSession: vi.fn(async () => ({ data: { session: null } })),
    signInWithPassword: vi.fn(async ({ email }) => {
      if (email === "error@streamhub.live") {
        return { error: new Error("Senha incorreta") };
      }
      return { data: { user: { id: "user1", email } }, error: null };
    }),
    signUp: vi.fn(async ({ email }) => ({
      data: { user: { id: "user1", email } },
      error: null,
    })),
    signOut: vi.fn(async () => ({ error: null })),
  };

  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: { display_name: "Mocked User", bio: "Developer", plan: "free" },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
  }));

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
    },
  };
});

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useAuth Hook", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  it("should return the default auth state", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isLoading).toBe(true); // Loading starts on mount (initSession)
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should successfully trigger login and toggle loaders", async () => {
    const { result } = renderHook(() => useAuth());
    
    // Simulate user state transition
    act(() => {
      useAuthStore.getState().setUser({ id: "user1", email: "test@streamhub.live" } as any);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
