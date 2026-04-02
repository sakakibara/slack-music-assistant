const MUSIC_URL_PATTERNS: RegExp[] = [
  // Spotify
  /https?:\/\/open\.spotify\.com\/(track|album|artist|playlist)\/[A-Za-z0-9]+[^\s>]*/g,
  // Apple Music
  /https?:\/\/music\.apple\.com\/[a-z]{2}\/[^\s>]+/g,
  // YouTube Music
  /https?:\/\/music\.youtube\.com\/watch\?[^\s>]+/g,
  // YouTube
  /https?:\/\/(?:www\.)?youtube\.com\/watch\?[^\s>]+/g,
  /https?:\/\/youtu\.be\/[A-Za-z0-9_-]+[^\s>]*/g,
  // Amazon Music
  /https?:\/\/music\.amazon\.(com|co\.jp|co\.uk|de|fr|it|es)\/[^\s>]+/g,
  // Tidal
  /https?:\/\/(?:www\.)?tidal\.com\/[^\s>]+/g,
  // Deezer
  /https?:\/\/(?:www\.)?deezer\.com\/[^\s>]+/g,
  // SoundCloud
  /https?:\/\/soundcloud\.com\/[^\s>]+/g,
];

export function detectMusicUrls(text: string): string[] {
  // Unwrap Slack's <url|label> format to just the URL
  const unwrapped = text.replace(/<([^|>]+)\|[^>]*>/g, "$1");

  const urls = new Set<string>();

  for (const pattern of MUSIC_URL_PATTERNS) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(unwrapped)) !== null) {
      // Remove trailing punctuation that's not part of the URL
      const url = match[0].replace(/[),.:;!?]+$/, "");
      urls.add(url);
    }
  }

  return [...urls];
}
