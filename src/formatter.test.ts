import { describe, it, expect } from "vitest";
import { formatMessage } from "./formatter";
import type { OdesliResult } from "./odesli";

describe("formatMessage", () => {
  it("formats a full result with title, artist, and platform links", () => {
    const result: OdesliResult = {
      title: "Bohemian Rhapsody",
      artistName: "Queen",
      pageUrl: "https://song.link/test",
      linksByPlatform: {
        spotify: "https://open.spotify.com/track/abc",
        appleMusic: "https://music.apple.com/test",
      },
    };

    const msg = formatMessage(result);
    expect(msg).toContain(":musical_note: *Bohemian Rhapsody* - Queen");
    expect(msg).toContain("• <https://open.spotify.com/track/abc|Spotify>");
    expect(msg).toContain("• <https://music.apple.com/test|Apple Music>");
    expect(msg).toContain(":link: <https://song.link/test|song.link で開く>");
  });

  it("formats without artist name", () => {
    const result: OdesliResult = {
      title: "Unknown Track",
      pageUrl: "https://song.link/test",
      linksByPlatform: {},
    };

    const msg = formatMessage(result);
    expect(msg).toContain(":musical_note: *Unknown Track*");
    expect(msg).not.toContain(" - ");
  });

  it("formats without title", () => {
    const result: OdesliResult = {
      pageUrl: "https://song.link/test",
      linksByPlatform: {
        spotify: "https://open.spotify.com/track/abc",
      },
    };

    const msg = formatMessage(result);
    expect(msg).not.toContain(":musical_note:");
    expect(msg).toContain("• <https://open.spotify.com/track/abc|Spotify>");
    expect(msg).toContain(":link:");
  });

  it("respects platform display order", () => {
    const result: OdesliResult = {
      title: "Test",
      pageUrl: "https://song.link/test",
      linksByPlatform: {
        deezer: "https://deezer.com/test",
        spotify: "https://spotify.com/test",
        tidal: "https://tidal.com/test",
      },
    };

    const msg = formatMessage(result);
    const spotifyIdx = msg.indexOf("Spotify");
    const tidalIdx = msg.indexOf("Tidal");
    const deezerIdx = msg.indexOf("Deezer");
    expect(spotifyIdx).toBeLessThan(tidalIdx);
    expect(tidalIdx).toBeLessThan(deezerIdx);
  });
});
