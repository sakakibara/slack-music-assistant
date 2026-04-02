import { describe, it, expect, vi, beforeEach } from "vitest";

let searchSpotifyTrack: typeof import("./spotify").searchSpotifyTrack;

beforeEach(async () => {
  vi.unstubAllGlobals();
  vi.resetModules();
  const mod = await import("./spotify");
  searchSpotifyTrack = mod.searchSpotifyTrack;
});

describe("searchSpotifyTrack", () => {
  it("returns Spotify URL for a matching track", async () => {
    const mockFetch = vi.fn()
      // Token request
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "test-token", expires_in: 3600 }),
      })
      // Search request
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            tracks: {
              items: [
                { external_urls: { spotify: "https://open.spotify.com/track/abc123" } },
              ],
            },
          }),
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await searchSpotifyTrack("Test Song", "Test Artist", "client-id", "client-secret");
    expect(result).toBe("https://open.spotify.com/track/abc123");

    // Verify search query includes track and artist
    const searchUrl = mockFetch.mock.calls[1][0] as string;
    expect(searchUrl).toContain("track%3ATest+Song");
    expect(searchUrl).toContain("artist%3ATest+Artist");
  });

  it("returns null when no results found", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "test-token", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } }),
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await searchSpotifyTrack("Nonexistent", "Nobody", "client-id", "client-secret");
    expect(result).toBeNull();
  });

  it("returns null when token request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    const result = await searchSpotifyTrack("Test", "Artist", "bad-id", "bad-secret");
    expect(result).toBeNull();
  });

  it("returns null when search request fails", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "test-token", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal("fetch", mockFetch);

    const result = await searchSpotifyTrack("Test", "Artist", "client-id", "client-secret");
    expect(result).toBeNull();
  });

  it("searches by title only when artist is empty", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "test-token", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            tracks: {
              items: [
                { external_urls: { spotify: "https://open.spotify.com/track/xyz" } },
              ],
            },
          }),
      });
    vi.stubGlobal("fetch", mockFetch);

    await searchSpotifyTrack("Test Song", "", "client-id", "client-secret");
    const searchUrl = mockFetch.mock.calls[1][0] as string;
    expect(searchUrl).toContain("q=Test+Song");
    expect(searchUrl).not.toContain("artist");
  });
});
