import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    // Call Spotify Search API
    const spotifyResponse = await fetch(
      `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    );

    if (!spotifyResponse.ok) {
      const errorData = await spotifyResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Spotify API error", details: errorData },
        { status: spotifyResponse.status },
      );
    }

    const data = (await spotifyResponse.json()) as {
      tracks: {
        items: SpotifyTrack[];
      };
    };

    // Transform to simplified format
    const allResults: SearchResult[] = data.tracks.items.map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      albumArt: track.album.images[0]?.url ?? "",
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
    }));

    // Deduplicate: group by title + artist, keep first occurrence (usually the main version)
    const seen = new Map<string, SearchResult>();
    const results: SearchResult[] = [];

    for (const track of allResults) {
      const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.set(key, track);
        results.push(track);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

