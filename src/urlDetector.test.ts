import { describe, it, expect } from "vitest";
import { detectMusicUrls } from "./urlDetector";

describe("detectMusicUrls", () => {
  it("detects Spotify track URLs", () => {
    const text = "Check this out: https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6";
    expect(detectMusicUrls(text)).toEqual([
      "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
    ]);
  });

  it("detects Spotify album and playlist URLs", () => {
    const text =
      "Album https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3 and playlist https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
    const urls = detectMusicUrls(text);
    expect(urls).toHaveLength(2);
    expect(urls).toContain("https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3");
    expect(urls).toContain("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M");
  });

  it("detects Apple Music URLs", () => {
    const text = "Listen here https://music.apple.com/us/album/some-album/123456";
    expect(detectMusicUrls(text)).toEqual([
      "https://music.apple.com/us/album/some-album/123456",
    ]);
  });

  it("detects YouTube Music URLs", () => {
    const text = "https://music.youtube.com/watch?v=dQw4w9WgXcQ";
    expect(detectMusicUrls(text)).toEqual([
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
    ]);
  });

  it("detects YouTube URLs", () => {
    const text = "https://www.youtube.com/watch?v=dQw4w9WgXcQ and https://youtu.be/dQw4w9WgXcQ";
    const urls = detectMusicUrls(text);
    expect(urls).toHaveLength(2);
    expect(urls).toContain("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(urls).toContain("https://youtu.be/dQw4w9WgXcQ");
  });

  it("detects Amazon Music URLs", () => {
    const text = "https://music.amazon.co.jp/albums/B08XYZ123";
    expect(detectMusicUrls(text)).toEqual([
      "https://music.amazon.co.jp/albums/B08XYZ123",
    ]);
  });

  it("detects Tidal URLs", () => {
    const text = "https://tidal.com/browse/track/12345678";
    expect(detectMusicUrls(text)).toEqual([
      "https://tidal.com/browse/track/12345678",
    ]);
  });

  it("detects Deezer URLs", () => {
    const text = "https://www.deezer.com/track/12345678";
    expect(detectMusicUrls(text)).toEqual([
      "https://www.deezer.com/track/12345678",
    ]);
  });

  it("detects SoundCloud URLs", () => {
    const text = "https://soundcloud.com/artist/track-name";
    expect(detectMusicUrls(text)).toEqual([
      "https://soundcloud.com/artist/track-name",
    ]);
  });

  it("strips trailing punctuation", () => {
    const text = "Check this: https://open.spotify.com/track/abc123.";
    expect(detectMusicUrls(text)).toEqual([
      "https://open.spotify.com/track/abc123",
    ]);
  });

  it("strips trailing parenthesis and comma", () => {
    const text = "(https://open.spotify.com/track/abc123),";
    expect(detectMusicUrls(text)).toEqual([
      "https://open.spotify.com/track/abc123",
    ]);
  });

  it("deduplicates identical URLs", () => {
    const text =
      "https://open.spotify.com/track/abc123 again https://open.spotify.com/track/abc123";
    expect(detectMusicUrls(text)).toHaveLength(1);
  });

  it("returns empty array for non-music text", () => {
    expect(detectMusicUrls("Just a regular message")).toEqual([]);
    expect(detectMusicUrls("https://google.com")).toEqual([]);
  });

  it("extracts URL from Slack link format <url|label>", () => {
    const text = "<https://open.spotify.com/track/abc123|https://open.spotify.com/track/abc123>";
    expect(detectMusicUrls(text)).toEqual([
      "https://open.spotify.com/track/abc123",
    ]);
  });

  it("extracts URL from Slack link with display text", () => {
    const text = "<https://music.apple.com/jp/album/test/123?i=456|Apple Music link>";
    expect(detectMusicUrls(text)).toEqual([
      "https://music.apple.com/jp/album/test/123?i=456",
    ]);
  });

  it("detects multiple platforms in one message", () => {
    const text =
      "Spotify: https://open.spotify.com/track/abc123 Apple: https://music.apple.com/us/album/test/999";
    expect(detectMusicUrls(text)).toHaveLength(2);
  });
});
