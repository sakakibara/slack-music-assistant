import { describe, it, expect, vi } from "vitest";
import { fetchLinks } from "./odesli";

const MOCK_API_RESPONSE = {
  entityUniqueId: "SPOTIFY_SONG::abc",
  pageUrl: "https://song.link/test",
  linksByPlatform: {
    spotify: { url: "https://open.spotify.com/track/abc", entityUniqueId: "SPOTIFY_SONG::abc" },
    appleMusic: { url: "https://music.apple.com/test", entityUniqueId: "APPLE_MUSIC_SONG::abc" },
  },
  entitiesByUniqueId: {
    "SPOTIFY_SONG::abc": {
      title: "Test Song",
      artistName: "Test Artist",
      thumbnailUrl: "https://example.com/thumb.jpg",
    },
  },
};

describe("fetchLinks", () => {
  it("parses a valid Odesli API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_API_RESPONSE),
      }),
    );

    const result = await fetchLinks("https://open.spotify.com/track/abc");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test Song");
    expect(result!.artistName).toBe("Test Artist");
    expect(result!.pageUrl).toBe("https://song.link/test");
    expect(result!.linksByPlatform.spotify).toBe("https://open.spotify.com/track/abc");
    expect(result!.linksByPlatform.appleMusic).toBe("https://music.apple.com/test");

    vi.unstubAllGlobals();
  });

  it("passes userCountry parameter", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_API_RESPONSE),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchLinks("https://open.spotify.com/track/abc", "US");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("userCountry=US");

    vi.unstubAllGlobals();
  });

  it("defaults userCountry to JP", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_API_RESPONSE),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchLinks("https://open.spotify.com/track/abc");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("userCountry=JP");

    vi.unstubAllGlobals();
  });

  it("returns null on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers() }),
    );

    const result = await fetchLinks("https://open.spotify.com/track/bad");
    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("retries on 429 and succeeds", async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers() })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_API_RESPONSE),
      });
    vi.stubGlobal("fetch", mockFetch);

    const promise = fetchLinks("https://open.spotify.com/track/abc");
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test Song");

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("gives up after max retries on persistent 429", async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 429, headers: new Headers(),
    });
    vi.stubGlobal("fetch", mockFetch);

    const promise = fetchLinks("https://open.spotify.com/track/abc");
    await vi.advanceTimersByTimeAsync(30_000);
    const result = await promise;

    expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(result).toBeNull();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns null on fetch failure (timeout, network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("AbortError")),
    );

    const result = await fetchLinks("https://open.spotify.com/track/abc");
    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("returns null when API response is missing required fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ entityUniqueId: "x" }),
      }),
    );

    const result = await fetchLinks("https://open.spotify.com/track/abc");
    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("handles missing primaryEntity gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ...MOCK_API_RESPONSE,
            entityUniqueId: "NONEXISTENT",
          }),
      }),
    );

    const result = await fetchLinks("https://open.spotify.com/track/abc");
    expect(result).not.toBeNull();
    expect(result!.title).toBeUndefined();
    expect(result!.artistName).toBeUndefined();
    expect(result!.pageUrl).toBe("https://song.link/test");

    vi.unstubAllGlobals();
  });
});
