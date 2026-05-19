import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStream } from "../../hooks/useStream";

describe("useStream Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default null/offline values", () => {
    const { result } = renderHook(() => useStream());
    expect(result.current.isLive).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.streamId).toBeNull();
    expect(result.current.stats.viewers).toBe(0);
    expect(result.current.stats.duration).toBe(0);
  });
});
