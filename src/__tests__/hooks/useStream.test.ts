import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStream } from "../../hooks/useStream";
import { useStreamStore } from "../../lib/stores/stream.store";

// Mock Supabase
vi.mock("../../lib/supabase", () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: {
            id: "stream123",
            user_id: "user1",
            title: "Gaming Live",
            status: "live",
            platforms: ["youtube"],
            started_at: new Date().toISOString(),
          },
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
      from: mockFrom,
    },
  };
});

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("useStream Hook", () => {
  beforeEach(() => {
    useStreamStore.getState().clearStream();
    vi.clearAllMocks();
  });

  it("should initialize with default null/offline values", () => {
    const { result } = renderHook(() => useStream("user1"));
    expect(result.current.isLive).toBe(false);
    expect(result.current.currentStream).toBeNull();
    expect(result.current.viewers).toBe(0);
    expect(result.current.duration).toBe(0);
  });
});
