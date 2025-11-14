import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackId, similarTrackIds, name } = body;

    if (!trackId || !similarTrackIds || !Array.isArray(similarTrackIds)) {
      return NextResponse.json(
        { error: "trackId and similarTrackIds array are required" },
        { status: 400 },
      );
    }

    // Get user's Spotify profile to get user ID
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get user profile" },
        { status: profileResponse.status },
      );
    }

    const profile = (await profileResponse.json()) as { id: string };
    const userId = profile.id;

    // Create playlist
    const playlistName = name || "Echoes Playlist";
    const createResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          description: "Created with Echoes - Emotion-level song discovery",
          public: false,
        }),
      },
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to create playlist", details: errorData },
        { status: createResponse.status },
      );
    }

    const playlist = (await createResponse.json()) as { id: string; external_urls: { spotify: string } };

    // Add tracks to playlist (include the original track + similar tracks)
    const allTrackIds = [trackId, ...similarTrackIds];
    const addTracksResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: allTrackIds.map((id) => `spotify:track:${id}`),
        }),
      },
    );

    if (!addTracksResponse.ok) {
      const errorData = await addTracksResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to add tracks to playlist", details: errorData },
        { status: addTracksResponse.status },
      );
    }

    return NextResponse.json({
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
      success: true,
    });
  } catch (error) {
    console.error("Playlist creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

