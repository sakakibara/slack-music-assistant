import type { OdesliResult, Platform } from "./odesli";

const PLATFORM_DISPLAY: { platform: Platform; label: string; emoji: string }[] = [
  { platform: "spotify", label: "Spotify", emoji: ":spotify:" },
  { platform: "appleMusic", label: "Apple Music", emoji: ":apple-music:" },
  { platform: "youtubeMusic", label: "YouTube Music", emoji: ":youtube-music:" },
  { platform: "amazonMusic", label: "Amazon Music", emoji: ":amazon-music:" },
  { platform: "tidal", label: "Tidal", emoji: ":tidal:" },
  { platform: "deezer", label: "Deezer", emoji: ":deezer:" },
  { platform: "soundcloud", label: "SoundCloud", emoji: ":soundcloud:" },
];

export interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

export function formatBlocks(result: OdesliResult): SlackBlock[] {
  const blocks: SlackBlock[] = [];

  // Title + artist section with optional thumbnail
  const titlePart = result.title ? `*${result.title}*` : "Unknown Track";
  const artistPart = result.artistName ? ` — ${result.artistName}` : "";
  const headerText = `:musical_note: ${titlePart}${artistPart}`;

  const headerBlock: SlackBlock = {
    type: "section",
    text: { type: "mrkdwn", text: headerText },
  };
  if (result.thumbnailUrl) {
    headerBlock.accessory = {
      type: "image",
      image_url: result.thumbnailUrl,
      alt_text: result.title ?? "Album art",
    };
  }
  blocks.push(headerBlock);

  // Platform link buttons
  const buttons = PLATFORM_DISPLAY
    .filter(({ platform }) => result.linksByPlatform[platform])
    .map(({ platform, label, emoji }) => ({
      type: "button",
      text: { type: "plain_text", text: `${emoji} ${label}`, emoji: true },
      url: result.linksByPlatform[platform],
      action_id: `open_${platform}`,
    }));

  if (buttons.length > 0) {
    blocks.push({ type: "actions", elements: buttons });
  }

  return blocks;
}

export function formatFallbackText(result: OdesliResult): string {
  const titlePart = result.title ? `*${result.title}*` : "Unknown Track";
  const artistPart = result.artistName ? ` — ${result.artistName}` : "";
  return `${titlePart}${artistPart}`;
}
