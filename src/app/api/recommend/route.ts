import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// Temporary in-memory storage for embeddings (replace with database)
const embeddingsCache = new Map<string, number[]>();

async function refreshSpotifyToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };
      console.log("Token refresh successful, new token expires in:", data.expires_in, "seconds");
      return data.access_token;
    } else {
      const errorText = await response.text();
      console.error("Token refresh failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return null;
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

interface RecommendationWeights {
  lyrics?: number;
  audio?: number;
  spotify?: number;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Normalize Spotify audio features into a vector
 */
function normalizeSpotifyFeatures(features: {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
}): number[] {
  // Normalize each feature to 0-1 range and create a vector
  return [
    features.danceability,
    features.energy,
    features.valence,
    features.acousticness,
    features.instrumentalness,
    features.speechiness,
    features.liveness,
  ];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let accessToken = session.accessToken;
    
    // Check if token is expired and refresh if needed
    if (session.expiresAt && Date.now() >= session.expiresAt - 60000) {
      console.log("Token expired or expiring soon, refreshing...");
      if (session.refreshToken) {
        const newToken = await refreshSpotifyToken(session.refreshToken);
        if (newToken) {
          accessToken = newToken;
          console.log("Token refreshed successfully");
        } else {
          console.error("Failed to refresh token");
          return NextResponse.json(
            { error: "Token expired and refresh failed. Please sign out and sign back in." },
            { status: 401 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "No refresh token available. Please sign out and sign back in." },
          { status: 401 },
        );
      }
    }

    const body = await request.json();
    const { trackId, limit = 20, weights = {} } = body as {
      trackId: string;
      limit?: number;
      weights?: RecommendationWeights;
    };

    if (!trackId) {
      return NextResponse.json(
        { error: "trackId is required" },
        { status: 400 },
      );
    }

    // Default weights: 50% lyrics, 35% audio, 15% Spotify features
    const finalWeights: Required<RecommendationWeights> = {
      lyrics: weights.lyrics ?? 0.5,
      audio: weights.audio ?? 0.35,
      spotify: weights.spotify ?? 0.15,
    };

    // Normalize weights to sum to 1
    const totalWeight = finalWeights.lyrics + finalWeights.audio + finalWeights.spotify;
    if (totalWeight > 0) {
      finalWeights.lyrics /= totalWeight;
      finalWeights.audio /= totalWeight;
      finalWeights.spotify /= totalWeight;
    }

    // Step 1: Get source track info and embeddings
    // For now, we'll use Spotify's recommendations as a base and enhance with embeddings
    // In production, you'd query the database for similar tracks

    // Get track info from Spotify
    // Extract base URL properly - handle both localhost and production URLs
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!trackResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch track info" },
        { status: trackResponse.status },
      );
    }

    const track = (await trackResponse.json()) as {
      name: string;
      artists: Array<{ name: string; id?: string }>;
    };

    // Extract artist ID from track response if available
    const artistId = track.artists?.[0]?.id || null;

    // Get lyrics embedding for source track
    let sourceLyricsEmbedding: number[] | null = null;
    if (finalWeights.lyrics > 0) {
      try {
        // Try to get lyrics
        const lyricsResponse = await fetch(`${baseUrl}/api/track/lyrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            trackId,
            title: track.name,
            artist: track.artists[0]?.name || "",
          }),
        });

        if (lyricsResponse.ok) {
          const lyricsData = (await lyricsResponse.json()) as { lyrics: string };
          if (lyricsData.lyrics) {
            // Generate embedding
            const embedResponse = await fetch(`${baseUrl}/api/embed/lyrics`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lyrics: lyricsData.lyrics }),
            });

            if (embedResponse.ok) {
              const embedData = (await embedResponse.json()) as { embedding: number[] };
              sourceLyricsEmbedding = embedData.embedding;
              embeddingsCache.set(trackId, embedData.embedding);
            }
          }
        }
      } catch (error) {
        console.warn("Failed to get lyrics embedding:", error);
      }
    }

    // Get Spotify audio features
    let sourceSpotifyFeatures: number[] | null = null;
    if (finalWeights.spotify > 0) {
      try {
        const featuresResponse = await fetch(
          `https://api.spotify.com/v1/audio-features/${trackId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (featuresResponse.ok) {
          const features = (await featuresResponse.json()) as {
            danceability: number;
            energy: number;
            valence: number;
            acousticness: number;
            instrumentalness: number;
            speechiness: number;
            liveness: number;
          };
          sourceSpotifyFeatures = normalizeSpotifyFeatures(features);
        }
      } catch (error) {
        console.warn("Failed to get audio features:", error);
      }
    }

    // Step 2: Get candidate tracks from Spotify recommendations

    // Build recommendations URL
    const recommendationsUrl = new URL("https://api.spotify.com/v1/recommendations");
    recommendationsUrl.searchParams.set("seed_tracks", trackId);
    if (artistId) {
      recommendationsUrl.searchParams.set("seed_artists", artistId);
    }
    recommendationsUrl.searchParams.set("limit", "50");
    recommendationsUrl.searchParams.set("market", "US");

    let recommendationsResponse = await fetch(recommendationsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // If 404 with seed_artists, retry with only seed_tracks
    if (recommendationsResponse.status === 404 && artistId) {
      console.log("Recommendations failed with seed_artists (404), trying with only seed_tracks");
      const retryUrl = new URL("https://api.spotify.com/v1/recommendations");
      retryUrl.searchParams.set("seed_tracks", trackId);
      retryUrl.searchParams.set("limit", "50");
      retryUrl.searchParams.set("market", "US");
      
      const retryResponse = await fetch(retryUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      console.log("Retry response status:", retryResponse.status);
      
      if (retryResponse.ok) {
        // Use the retry response
        recommendationsResponse = retryResponse;
        console.log("Retry successful, using recommendations from retry");
      } else {
        // Retry also failed, log but continue with original response for error handling
        const retryErrorText = await retryResponse.text().catch(() => "Could not read error");
        console.error("Retry also failed:", {
          status: retryResponse.status,
          error: retryErrorText,
        });
        // Keep the original 404 response for error handling below
      }
    }

    if (!recommendationsResponse.ok) {
      const errorText = await recommendationsResponse.text().catch(() => "Could not read error");
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      
      console.error("Spotify recommendations API failed:", {
        status: recommendationsResponse.status,
        statusText: recommendationsResponse.statusText,
        error: errorData,
        url: recommendationsUrl.toString(),
        trackId,
      });
      
      return NextResponse.json(
        { 
          error: `Failed to get recommendations: ${recommendationsResponse.status} ${recommendationsResponse.statusText}`,
          details: errorData,
          status: recommendationsResponse.status,
        },
        { status: recommendationsResponse.status },
      );
    }

    const recommendations = (await recommendationsResponse.json()) as {
      tracks: Array<{
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string; images: Array<{ url: string }> };
        preview_url: string | null;
        external_urls: { spotify: string };
      }>;
    };

    console.log(`Received ${recommendations.tracks?.length || 0} tracks from Spotify recommendations`);

    if (!recommendations.tracks || recommendations.tracks.length === 0) {
      console.warn("No tracks returned from Spotify recommendations");
      return NextResponse.json(
        { 
          error: "No recommendations available for this track",
          recommendations: [],
        },
        { status: 200 }, // Return 200 but with empty results
      );
    }

    // Step 3: Score each candidate track
    const scoredTracks = await Promise.all(
      recommendations.tracks
        .filter((t) => t.id !== trackId)
        .map(async (candidateTrack) => {
          let lyricsScore = 0;
          let spotifyScore = 0;

          // Get or generate embedding for candidate track
          let candidateEmbedding: number[] | null = null;
          if (sourceLyricsEmbedding && finalWeights.lyrics > 0) {
            try {
              candidateEmbedding = embeddingsCache.get(candidateTrack.id) || null;
              if (!candidateEmbedding) {
                const lyricsRes = await fetch(`${baseUrl}/api/track/lyrics`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    title: candidateTrack.name,
                    artist: candidateTrack.artists[0]?.name || "",
                  }),
                });

                if (lyricsRes.ok) {
                  const lyricsData = (await lyricsRes.json()) as { lyrics: string };
                  if (lyricsData.lyrics) {
                    const embedRes = await fetch(`${baseUrl}/api/embed/lyrics`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ lyrics: lyricsData.lyrics }),
                    });

                    if (embedRes.ok) {
                      const embedData = (await embedRes.json()) as { embedding: number[] };
                      candidateEmbedding = embedData.embedding;
                      embeddingsCache.set(candidateTrack.id, embedData.embedding);
                    }
                  }
                }
              }

              if (candidateEmbedding) {
                lyricsScore = cosineSimilarity(sourceLyricsEmbedding, candidateEmbedding);
              }
            } catch (error) {
              console.warn(`Failed to compute lyrics similarity for ${candidateTrack.id}:`, error);
            }
          }

          // Calculate Spotify features similarity
          if (sourceSpotifyFeatures && finalWeights.spotify > 0) {
            try {
              const featuresRes = await fetch(
                `https://api.spotify.com/v1/audio-features/${candidateTrack.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              );

              if (featuresRes.ok) {
                const features = (await featuresRes.json()) as {
                  danceability: number;
                  energy: number;
                  valence: number;
                  acousticness: number;
                  instrumentalness: number;
                  speechiness: number;
                  liveness: number;
                };
                const candidateFeatures = normalizeSpotifyFeatures(features);
                spotifyScore = cosineSimilarity(sourceSpotifyFeatures, candidateFeatures);
              }
            } catch (error) {
              console.warn(`Failed to compute Spotify similarity for ${candidateTrack.id}:`, error);
            }
          }

          // Calculate weighted score
          const totalScore =
            lyricsScore * finalWeights.lyrics +
            spotifyScore * finalWeights.spotify;
          // Audio embedding score would go here when implemented

          return {
            track: candidateTrack,
            score: totalScore,
            breakdown: {
              lyrics: lyricsScore * finalWeights.lyrics,
              spotify: spotifyScore * finalWeights.spotify,
              audio: 0, // Placeholder for audio embeddings
            },
          };
        }),
    );

    // Step 4: Sort by score and return top results
    scoredTracks.sort((a, b) => b.score - a.score);

    const results = scoredTracks.slice(0, limit).map((item) => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists.map((a) => a.name).join(", "),
      album: item.track.album.name,
      albumArt: item.track.album.images[0]?.url ?? "",
      previewUrl: item.track.preview_url,
      spotifyUrl: item.track.external_urls.spotify,
      score: item.score,
      breakdown: item.breakdown,
    }));

    return NextResponse.json({
      recommendations: results,
      sourceTrackId: trackId,
      weights: finalWeights,
    });
  } catch (error) {
    console.error("Recommendation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

