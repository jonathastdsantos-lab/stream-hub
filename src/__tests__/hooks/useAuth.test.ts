import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useAuth Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return the default auth state", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false); // sets to false on mount since no localStorage tokens
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should initialize from localStorage if token and user exist", () => {
    const fakeUser = { id: "user1", email: "test@streamhub.live", name: "Streamer" };
    localStorage.setItem("auth_token", "fake_token");
    localStorage.setItem("auth_user", JSON.stringify(fakeUser));

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});
