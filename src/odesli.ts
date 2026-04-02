const ODESLI_API_URL = "https://api.song.link/v1-alpha.1/links";

export type Platform =
  | "spotify"
  | "appleMusic"
  | "youtubeMusic"
  | "youtube"
  | "amazonMusic"
  | "soundcloud";

interface OdesliEntity {
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
}

interface OdesliPlatformLink {
  url: string;
  entityUniqueId: string;
}

interface OdesliApiResponse {
  entityUniqueId: string;
  pageUrl: string;
  linksByPlatform: Partial<Record<Platform, OdesliPlatformLink>>;
  entitiesByUniqueId: Record<string, OdesliEntity>;
}

export interface OdesliResult {
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
  pageUrl: string;
  linksByPlatform: Partial<Record<Platform, string>>;
}

export async function fetchLinks(
  url: string,
  userCountry = "JP",
): Promise<OdesliResult | null> {
  const apiUrl = new URL(ODESLI_API_URL);
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("userCountry", userCountry);

  const MAX_RETRIES = 3;
  const response = await (async () => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let res: Response;
      try {
        res = await fetch(apiUrl.toString(), {
          signal: AbortSignal.timeout(10_000),
        });
      } catch (err) {
        console.error(`Odesli API request failed for ${url}:`, err);
        return null;
      }
      if (res.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get("retry-after")) || 2;
        const delay = retryAfter * 1000 * (attempt + 1);
        console.warn(`Odesli API rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res;
    }
    return null;
  })();
  if (!response?.ok) {
    if (response) console.error(`Odesli API error: ${response.status} for ${url}`);
    return null;
  }

  const data = (await response.json()) as OdesliApiResponse;

  if (!data.pageUrl || !data.linksByPlatform) {
    console.error(`Odesli API returned unexpected data for ${url}`);
    return null;
  }

  // Extract metadata from the primary entity
  const primaryEntity = data.entityUniqueId
    ? data.entitiesByUniqueId?.[data.entityUniqueId]
    : undefined;

  // Flatten linksByPlatform to just URLs
  const linksByPlatform: Partial<Record<Platform, string>> = {};
  for (const [platform, link] of Object.entries(data.linksByPlatform)) {
    linksByPlatform[platform as Platform] = link.url;
  }

  return {
    title: primaryEntity?.title,
    artistName: primaryEntity?.artistName,
    thumbnailUrl: primaryEntity?.thumbnailUrl,
    pageUrl: data.pageUrl,
    linksByPlatform,
  };
}
