import type { OdesliResult, Platform } from "./odesli";

const PLATFORM_DISPLAY: { platform: Platform; label: string }[] = [
  { platform: "spotify", label: "Spotify" },
  { platform: "appleMusic", label: "Apple Music" },
  { platform: "youtubeMusic", label: "YouTube Music" },
  { platform: "amazonMusic", label: "Amazon Music" },
  { platform: "tidal", label: "Tidal" },
  { platform: "deezer", label: "Deezer" },
  { platform: "soundcloud", label: "SoundCloud" },
];

export function formatMessage(result: OdesliResult): string {
  const lines: string[] = [];

  // Title + artist
  if (result.title) {
    const titlePart = `*${result.title}*`;
    const artistPart = result.artistName ? ` - ${result.artistName}` : "";
    lines.push(`:musical_note: ${titlePart}${artistPart}`);
    lines.push("");
  }

  // Platform links
  for (const { platform, label } of PLATFORM_DISPLAY) {
    const url = result.linksByPlatform[platform];
    if (url) {
      lines.push(`• <${url}|${label}>`);
    }
  }

  // song.link page
  lines.push("");
  lines.push(`:link: <${result.pageUrl}|song.link で開く>`);

  return lines.join("\n");
}
