import type { OdesliResult, Platform } from "./odesli";

const PLATFORM_DISPLAY: { platform: Platform; label: string }[] = [
  { platform: "spotify", label: "Spotify" },
  { platform: "appleMusic", label: "Apple Music" },
  { platform: "youtubeMusic", label: "YouTube Music" },
  { platform: "youtube", label: "YouTube" },
  { platform: "amazonMusic", label: "Amazon Music" },
  { platform: "soundcloud", label: "SoundCloud" },
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
    .map(({ platform, label }) => ({
      type: "button",
      text: { type: "plain_text", text: label },
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
