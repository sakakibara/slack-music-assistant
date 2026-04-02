export async function searchYouTubeTrack(
  title: string,
  artist: string,
  apiKey: string,
): Promise<string | null> {
  const query = artist ? `${title} ${artist}` : title;
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10"); // Music category
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("YouTube search request failed:", err);
    return null;
  }

  if (!response.ok) {
    console.error(`YouTube search error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    items?: { id?: { videoId?: string } }[];
  };

  const videoId = data.items?.[0]?.id?.videoId;
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}
