import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchYouTubeTrack } from "./youtube";

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("searchYouTubeTrack", () => {
  it("returns YouTube URL for a matching video", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [{ id: { videoId: "dQw4w9WgXcQ" } }],
          }),
      }),
    );

    const result = await searchYouTubeTrack("Test Song", "Test Artist", "api-key");
    expect(result).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("passes music category and query params", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await searchYouTubeTrack("Test Song", "Test Artist", "api-key");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("videoCategoryId=10");
    expect(calledUrl).toContain("type=video");
    expect(calledUrl).toContain("key=api-key");
  });

  it("returns null when no results found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      }),
    );

    const result = await searchYouTubeTrack("Nonexistent", "Nobody", "api-key");
    expect(result).toBeNull();
  });

  it("returns null on API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    );

    const result = await searchYouTubeTrack("Test", "Artist", "bad-key");
    expect(result).toBeNull();
  });

  it("returns null on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("timeout")),
    );

    const result = await searchYouTubeTrack("Test", "Artist", "api-key");
    expect(result).toBeNull();
  });
});
