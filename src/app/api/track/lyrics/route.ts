import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// Simple in-memory cache for lyrics (will be replaced with Redis/Postgres later)
const lyricsCache = new Map<string, { lyrics: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

async function fetchLyricsFromGenius(title: string, artist: string): Promise<string | null> {
  try {
    const accessToken = process.env.GENIUS_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn("GENIUS_ACCESS_TOKEN not set, skipping lyrics fetch");
      return null;
    }

    // Search for the song
    const searchQuery = `${title} ${artist}`;
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      console.error("Genius search failed:", searchResponse.status);
      return null;
    }

    const searchData = (await searchResponse.json()) as {
      response: {
        hits: Array<{
          result: {
            id: number;
            title: string;
            primary_artist: { name: string };
            url: string;
          };
        }>;
      };
    };

    const hits = searchData.response?.hits || [];
    if (hits.length === 0) {
      return null;
    }

    // Get the first matching result
    const result = hits[0].result;
    const lyricsUrl = result.url;

    // Note: Genius API doesn't directly return lyrics text
    // You would need to scrape the page or use a different service
    // For now, return null and log that we found the song
    console.log(`Found song on Genius: ${result.title} by ${result.primary_artist.name} (${lyricsUrl})`);
    
    // TODO: Implement actual lyrics scraping or use a service that provides lyrics text
    return null;
  } catch (error) {
    console.error("Error fetching lyrics from Genius:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackId, title, artist } = body;

    // Use trackId if provided, otherwise use title/artist
    const cacheKey = trackId || `${title}|${artist}`;

    // Check cache
    const cached = lyricsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        lyrics: cached.lyrics,
        cached: true,
      });
    }

    // Fetch lyrics
    let lyrics: string | null = null;

    if (title && artist) {
      lyrics = await fetchLyricsFromGenius(title, artist);
    }

    if (!lyrics) {
      return NextResponse.json(
        { error: "Lyrics not available for this track" },
        { status: 404 },
      );
    }

    // Clean lyrics (remove timestamps, annotations, etc.)
    const cleanedLyrics = lyrics
      .replace(/\[.*?\]/g, "") // Remove [Verse 1], [Chorus], etc.
      .replace(/\(.*?\)/g, "") // Remove (spoken), (instrumental), etc.
      .replace(/\d{1,2}:\d{2}/g, "") // Remove timestamps like 1:23
      .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
      .trim();

    // Cache the result
    lyricsCache.set(cacheKey, {
      lyrics: cleanedLyrics,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      lyrics: cleanedLyrics,
      cached: false,
    });
  } catch (error) {
    console.error("Lyrics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

