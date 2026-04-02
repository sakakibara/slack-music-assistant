import { detectMusicUrls } from "./urlDetector";
import { fetchLinks } from "./odesli";
import { searchSpotifyTrack } from "./spotify";
import { searchYouTubeTrack } from "./youtube";
import { formatBlocks, formatFallbackText } from "./formatter";
import type { SlackBlock } from "./formatter";

export async function verifySlackSignature(
  request: Request,
  signingSecret: string,
): Promise<boolean> {
  const signature = request.headers.get("x-slack-signature");
  const timestamp = request.headers.get("x-slack-request-timestamp");

  if (!signature || !timestamp) {
    return false;
  }

  // Reject requests older than 5 minutes to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 60 * 5) {
    return false;
  }

  const body = await request.clone().text();
  const baseString = `v0:${timestamp}:${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(baseString),
  );

  const computed =
    "v0=" +
    [...new Uint8Array(signatureBytes)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return computed === signature;
}

interface SlackMessageEvent {
  type: string;
  subtype?: string;
  bot_id?: string;
  text?: string;
  channel: string;
  ts: string;
}

interface SlackEventPayload {
  type: string;
  challenge?: string;
  event?: SlackMessageEvent;
}

export function parseEventPayload(body: string): SlackEventPayload | null {
  try {
    return JSON.parse(body) as SlackEventPayload;
  } catch {
    console.error("Failed to parse Slack event payload");
    return null;
  }
}

export interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
}

export interface FallbackApis {
  spotify?: SpotifyCredentials;
  youtubeApiKey?: string;
}

export async function handleMessageEvent(
  event: SlackMessageEvent,
  botToken: string,
  userCountry?: string,
  fallbacks?: FallbackApis,
): Promise<void> {
  // Ignore bot messages to prevent infinite loops
  if (event.bot_id || event.subtype) {
    return;
  }

  if (!event.text) {
    return;
  }

  const urls = detectMusicUrls(event.text);
  if (urls.length === 0) {
    return;
  }

  // Process each detected URL
  for (const url of urls) {
    const result = await fetchLinks(url, userCountry);
    if (!result) {
      continue;
    }

    // Fallback searches for missing platforms
    if (result.title && fallbacks) {
      const fallbackPromises: Promise<void>[] = [];

      if (!result.linksByPlatform.spotify && fallbacks.spotify) {
        const { clientId, clientSecret } = fallbacks.spotify;
        fallbackPromises.push(
          searchSpotifyTrack(result.title, result.artistName ?? "", clientId, clientSecret)
            .then((url) => { if (url) result.linksByPlatform.spotify = url; }),
        );
      }

      if (!result.linksByPlatform.youtube && !result.linksByPlatform.youtubeMusic && fallbacks.youtubeApiKey) {
        fallbackPromises.push(
          searchYouTubeTrack(result.title, result.artistName ?? "", fallbacks.youtubeApiKey)
            .then((url) => { if (url) result.linksByPlatform.youtube = url; }),
        );
      }

      await Promise.all(fallbackPromises);
    }

    const blocks = formatBlocks(result);
    const fallback = formatFallbackText(result);
    await postThreadReply(botToken, event.channel, event.ts, fallback, blocks);
  }
}

async function postThreadReply(
  botToken: string,
  channel: string,
  threadTs: string,
  text: string,
  blocks: SlackBlock[],
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel,
        thread_ts: threadTs,
        text,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("Slack API request failed:", err);
    return;
  }

  if (!response.ok) {
    console.error(`Slack API HTTP error: ${response.status}`);
    return;
  }

  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    console.error(`Slack API error: ${data.error}`);
  }
}
