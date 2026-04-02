import { describe, it, expect } from "vitest";
import { formatBlocks, formatFallbackText } from "./formatter";
import type { OdesliResult } from "./odesli";

describe("formatBlocks", () => {
  it("returns header section with title, artist, and thumbnail", () => {
    const result: OdesliResult = {
      title: "Bohemian Rhapsody",
      artistName: "Queen",
      thumbnailUrl: "https://example.com/thumb.jpg",
      pageUrl: "https://song.link/test",
      linksByPlatform: {
        spotify: "https://open.spotify.com/track/abc",
      },
    };

    const blocks = formatBlocks(result);
    const header = blocks[0];
    expect(header.type).toBe("section");
    expect((header.text as { text: string }).text).toContain("*Bohemian Rhapsody*");
    expect((header.text as { text: string }).text).toContain("Queen");
    expect((header.accessory as { image_url: string }).image_url).toBe(
      "https://example.com/thumb.jpg",
    );
  });

  it("omits thumbnail accessory when not available", () => {
    const result: OdesliResult = {
      title: "Test",
      pageUrl: "https://song.link/test",
      linksByPlatform: {},
    };

    const blocks = formatBlocks(result);
    expect(blocks[0].accessory).toBeUndefined();
  });

  it("shows 'Unknown Track' when title is missing", () => {
    const result: OdesliResult = {
      pageUrl: "https://song.link/test",
      linksByPlatform: {},
    };

    const blocks = formatBlocks(result);
    expect((blocks[0].text as { text: string }).text).toContain("Unknown Track");
  });

  it("creates buttons for available platforms", () => {
    const result: OdesliResult = {
      title: "Test",
      pageUrl: "https://song.link/test",
      linksByPlatform: {
        spotify: "https://open.spotify.com/track/abc",
        appleMusic: "https://music.apple.com/test",
      },
    };

    const blocks = formatBlocks(result);
    const actions = blocks[1];
    expect(actions.type).toBe("actions");
    const elements = actions.elements as { text: { text: string }; url: string }[];
    expect(elements).toHaveLength(2);
    expect(elements[0].text.text).toContain("Spotify");
    expect(elements[0].url).toBe("https://open.spotify.com/track/abc");
    expect(elements[1].text.text).toContain("Apple Music");
  });

  it("does not include song.link link", () => {
    const result: OdesliResult = {
      title: "Test",
      pageUrl: "https://song.link/test",
      linksByPlatform: {
        spotify: "https://open.spotify.com/track/abc",
      },
    };

    const blocks = formatBlocks(result);
    const allText = JSON.stringify(blocks);
    expect(allText).not.toContain("song.link");
  });

  it("respects platform display order in buttons", () => {
    const result: OdesliResult = {
      title: "Test",
      pageUrl: "https://song.link/test",
      linksByPlatform: {
        soundcloud: "https://soundcloud.com/test",
        spotify: "https://spotify.com/test",
        amazonMusic: "https://music.amazon.com/test",
      },
    };

    const blocks = formatBlocks(result);
    const elements = (blocks[1].elements as { text: { text: string } }[]);
    expect(elements[0].text.text).toContain("Spotify");
    expect(elements[1].text.text).toContain("Amazon Music");
    expect(elements[2].text.text).toContain("SoundCloud");
  });
});

describe("formatFallbackText", () => {
  it("returns title and artist", () => {
    const result: OdesliResult = {
      title: "Test Song",
      artistName: "Test Artist",
      pageUrl: "https://song.link/test",
      linksByPlatform: {},
    };
    expect(formatFallbackText(result)).toBe("*Test Song* — Test Artist");
  });

  it("returns Unknown Track when no title", () => {
    const result: OdesliResult = {
      pageUrl: "https://song.link/test",
      linksByPlatform: {},
    };
    expect(formatFallbackText(result)).toBe("Unknown Track");
  });
});
