let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  let response: Response;
  try {
    response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("Spotify token request failed:", err);
    return null;
  }

  if (!response.ok) {
    console.error(`Spotify token error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: data.access_token,
    // Expire 60s early to avoid edge cases
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

export async function searchSpotifyTrack(
  title: string,
  artist: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  const token = await getAccessToken(clientId, clientSecret);
  if (!token) {
    return null;
  }

  const query = artist ? `track:${title} artist:${artist}` : title;
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "1");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("Spotify search request failed:", err);
    return null;
  }

  if (!response.ok) {
    console.error(`Spotify search error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    tracks?: {
      items?: { external_urls?: { spotify?: string } }[];
    };
  };

  return data.tracks?.items?.[0]?.external_urls?.spotify ?? null;
}
