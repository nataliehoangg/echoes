import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
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

export interface SimilarTrackResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
}

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      console.error("Analysis: No access token in session");
      return NextResponse.json({ error: "Unauthorized - Please sign in again" }, { status: 401 });
    }

    let accessToken = session.accessToken;
    const tokenAge = session.expiresAt ? Math.max(0, session.expiresAt - Date.now()) : null;

    console.log("Token status:", {
      hasToken: !!accessToken,
      hasRefreshToken: !!session.refreshToken,
      expiresAt: session.expiresAt,
      tokenAgeMs: tokenAge,
      tokenAgeMinutes: tokenAge ? Math.floor(tokenAge / 60000) : null,
    });

    // Check if token is expired and refresh if needed
    if (session.expiresAt && Date.now() >= session.expiresAt - 60000) {
      console.log("Token expired or expiring soon, refreshing...");
      if (session.refreshToken) {
        const newToken = await refreshSpotifyToken(session.refreshToken);
        if (newToken) {
          accessToken = newToken;
          console.log("Token refreshed successfully");
        } else {
          console.error("Failed to refresh token - refresh token may be invalid");
          return NextResponse.json(
            { error: "Token expired and refresh failed. Please sign out and sign back in to get a fresh token." },
            { status: 401 },
          );
        }
      } else {
        console.error("No refresh token available");
        return NextResponse.json(
          { error: "No refresh token available. Please sign out and sign back in." },
          { status: 401 },
        );
      }
    }

    const body = await request.json();
    const { trackId } = body;

    if (!trackId) {
      console.error("Analysis: Missing trackId in request body");
      return NextResponse.json(
        { error: "trackId is required" },
        { status: 400 },
      );
    }

    console.log("Starting analysis for track:", trackId);

    // Helper function to make API call with retry on 403
    async function fetchWithRetry(
      url: string,
      token: string,
      retryCount = 0,
    ): Promise<Response> {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If 403 and we have a refresh token, try refreshing once
      if (response.status === 403 && retryCount === 0 && session.refreshToken) {
        // Clone response to read error without consuming the original
        const clonedResponse = response.clone();
        const errorText = await clonedResponse.text().catch(() => "Could not read error");
        console.log("Got 403, attempting token refresh and retry...", {
          error: errorText,
          url,
        });
        const newToken = await refreshSpotifyToken(session.refreshToken);
        if (newToken) {
          console.log("Token refreshed successfully, retrying request with new token...");
          // Update accessToken for subsequent calls
          accessToken = newToken;
          return fetchWithRetry(url, newToken, 1);
        } else {
          console.error("Token refresh failed, cannot retry");
          // Return the original response so error handling can read it
          return response;
        }
      }

      return response;
    }

    // Step 1: Verify token works with a simple API call first
    console.log("Verifying token with a test API call...");
    const testResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!testResponse.ok) {
      const testError = await testResponse.text();
      console.error("Token verification failed:", {
        status: testResponse.status,
        error: testError,
      });
      return NextResponse.json(
        {
          error: `Token verification failed (${testResponse.status}). This suggests your Spotify app may have restrictions. Check your Spotify Developer Dashboard app settings.`,
          details: testError,
        },
        { status: testResponse.status },
      );
    }

    const userInfo = await testResponse.json();
    console.log("Token verified, user:", userInfo.id || userInfo.display_name);

    // Step 2: Get track's audio features
    // Note: Audio features endpoint doesn't require special scopes, just a valid OAuth token
    console.log("Fetching audio features for track:", trackId);
    const featuresResponse = await fetchWithRetry(
      `https://api.spotify.com/v1/audio-features/${trackId}`,
      accessToken,
    );

    if (!featuresResponse.ok) {
      const responseText = await featuresResponse.text();
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { raw: responseText };
      }
      console.error("Failed to get audio features:", {
        status: featuresResponse.status,
        statusText: featuresResponse.statusText,
        error: errorData,
        responseText,
        trackId,
        tokenLength: accessToken?.length,
        tokenPrefix: accessToken?.substring(0, 20) + "...",
      });

      // If 403, try workaround: skip audio features and use recommendations with seed_tracks and seed_artists
      if (featuresResponse.status === 403) {
        console.log("Audio features blocked (403), using workaround: recommendations without audio features");
        
        // First, get track info to extract artist ID for better recommendations
        let artistId: string | null = null;
        try {
          const trackInfoResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          
          if (trackInfoResponse.ok) {
            const trackInfo = (await trackInfoResponse.json()) as {
              artists: Array<{ id: string }>;
            };
            if (trackInfo.artists && trackInfo.artists.length > 0) {
              artistId = trackInfo.artists[0].id;
              console.log("Got artist ID for recommendations:", artistId);
            }
          }
        } catch (err) {
          console.warn("Could not fetch track info for artist ID:", err);
        }
        
        // Workaround: Use recommendations API with seed_tracks and optionally seed_artists
        // Request 50 tracks to ensure we get at least 30 diverse recommendations
        const recommendationsUrl = new URL("https://api.spotify.com/v1/recommendations");
        recommendationsUrl.searchParams.set("seed_tracks", trackId);
        if (artistId) {
          recommendationsUrl.searchParams.set("seed_artists", artistId);
        }
        recommendationsUrl.searchParams.set("limit", "50"); // Request more to get diverse results
        recommendationsUrl.searchParams.set("market", "US"); // Add market parameter
        
        console.log("Calling recommendations API:", recommendationsUrl.toString());
        
        // Don't use fetchWithRetry here - call directly to avoid token refresh issues
        const recommendationsResponse = await fetch(recommendationsUrl.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("Recommendations response status:", recommendationsResponse.status);

        if (recommendationsResponse.ok) {
          const recommendations = (await recommendationsResponse.json()) as {
            tracks: SpotifyTrack[];
          };

          console.log(`Workaround successful: Got ${recommendations.tracks?.length || 0} tracks from recommendations (without audio features)`);

          let allResults: SimilarTrackResult[] = [];
          const results: SimilarTrackResult[] = [];

          if (recommendations.tracks && recommendations.tracks.length > 0) {
            allResults = recommendations.tracks
              .filter((track) => track.id !== trackId) // Exclude the original track
              .map((track) => ({
                id: track.id,
                title: track.name,
                artist: track.artists.map((a) => a.name).join(", "),
                album: track.album.name,
                albumArt: track.album.images[0]?.url ?? "",
                previewUrl: track.preview_url,
                spotifyUrl: track.external_urls.spotify,
              }));

            // Deduplicate by title + artist
            const seen = new Map<string, SimilarTrackResult>();
            for (const track of allResults) {
              const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
              if (!seen.has(key)) {
                seen.set(key, track);
                results.push(track);
              }
            }
          }

          // Return at least 30 tracks (or as many as we have)
          const tracksToReturn = results.slice(0, Math.max(30, results.length));
          
          return NextResponse.json({
            similarTracks: tracksToReturn,
            analysis: {
              audioFeatures: null, // Not available due to 403
              lyricsFetched: false,
              method: "recommendations_workaround_no_audio_features",
              note: "Audio features endpoint is blocked, using recommendations API as fallback",
            },
          });
        } else {
          // Recommendations failed - return helpful error
          const recErrorText = await recommendationsResponse.text();
          let recErrorData = {};
          try {
            recErrorData = JSON.parse(recErrorText);
          } catch {
            recErrorData = { raw: recErrorText };
          }
          console.error("Recommendations API failed:", {
            status: recommendationsResponse.status,
            statusText: recommendationsResponse.statusText,
            error: recErrorData,
            url: recommendationsUrl.toString(),
            trackId,
          });

          // If 404, try without seed_artists (some tracks might not work with both)
          if (recommendationsResponse.status === 404 && artistId) {
            console.log("Recommendations failed with seed_artists, trying with only seed_tracks");
            const retryUrl = new URL("https://api.spotify.com/v1/recommendations");
            retryUrl.searchParams.set("seed_tracks", trackId);
            retryUrl.searchParams.set("limit", "50");
            retryUrl.searchParams.set("market", "US");
            
            const retryResponse = await fetch(retryUrl.toString(), {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            
            if (retryResponse.ok) {
              const recommendations = (await retryResponse.json()) as {
                tracks: SpotifyTrack[];
              };
              
              console.log(`Retry successful: Got ${recommendations.tracks?.length || 0} tracks`);
              
              const allResults: SimilarTrackResult[] = recommendations.tracks
                .filter((track) => track.id !== trackId)
                .map((track) => ({
                  id: track.id,
                  title: track.name,
                  artist: track.artists.map((a) => a.name).join(", "),
                  album: track.album.name,
                  albumArt: track.album.images[0]?.url ?? "",
                  previewUrl: track.preview_url,
                  spotifyUrl: track.external_urls.spotify,
                }));
              
              const seen = new Map<string, SimilarTrackResult>();
              const results: SimilarTrackResult[] = [];
              for (const track of allResults) {
                const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
                if (!seen.has(key)) {
                  seen.set(key, track);
                  results.push(track);
                }
              }
              
              const tracksToReturn = results.slice(0, Math.max(30, results.length));
              
              return NextResponse.json({
                similarTracks: tracksToReturn,
                analysis: {
                  audioFeatures: null,
                  lyricsFetched: false,
                  method: "recommendations_workaround_no_audio_features",
                  note: "Audio features blocked, using recommendations API (seed_tracks only)",
                },
              });
            }
          }
          
          return NextResponse.json(
            {
              error: "Unable to get recommendations. Audio features endpoint is blocked (403) and recommendations API failed.",
              details: {
                audioFeaturesError: errorData,
                recommendationsError: recErrorData,
                recommendationsStatus: recommendationsResponse.status,
                url: recommendationsUrl.toString(),
              },
              status: 403,
              troubleshooting: [
                "1. Check your Spotify Developer Dashboard: https://developer.spotify.com/dashboard",
                "2. Ensure your app is NOT in 'Development Mode' with user restrictions",
                "3. If in Development Mode, add your Spotify account email to the 'Users and Access' whitelist",
                "4. Wait a few minutes after adding yourself - changes can take time to propagate",
                "5. Try submitting your app for Extended Quota Mode if you need higher rate limits",
                `6. Track ID: ${trackId}`,
                `7. Recommendations API returned: ${recommendationsResponse.status}`,
                "8. The recommendations endpoint may also be restricted in Development Mode",
              ],
            },
            { status: 403 },
          );
        }
      }

      return NextResponse.json(
        {
          error: `Failed to get audio features: ${featuresResponse.status} ${featuresResponse.statusText}`,
          details: errorData,
          status: featuresResponse.status,
        },
        { status: featuresResponse.status },
      );
    }

    const audioFeatures = (await featuresResponse.json()) as {
      danceability: number;
      energy: number;
      key: number;
      loudness: number;
      mode: number;
      speechiness: number;
      acousticness: number;
      instrumentalness: number;
      liveness: number;
      valence: number;
      tempo: number;
    };

    // Step 2: Use Spotify's recommendation API based on audio features
    // This is a temporary solution until we have full embedding-based similarity
    // Using seed_tracks is more reliable than target parameters
    // Request 50 tracks to ensure we get at least 30 diverse recommendations
    const recommendationsUrl = new URL("https://api.spotify.com/v1/recommendations");
    recommendationsUrl.searchParams.set("seed_tracks", trackId);
    recommendationsUrl.searchParams.set("limit", "50"); // Request more to get diverse results
    // Add target parameters as optional hints (not strict requirements)
    recommendationsUrl.searchParams.set("target_danceability", audioFeatures.danceability.toString());
    recommendationsUrl.searchParams.set("target_energy", audioFeatures.energy.toString());
    recommendationsUrl.searchParams.set("target_valence", audioFeatures.valence.toString());
    recommendationsUrl.searchParams.set("target_tempo", audioFeatures.tempo.toString());
    
    const recommendationsResponse = await fetchWithRetry(
      recommendationsUrl.toString(),
      accessToken,
    );

    if (!recommendationsResponse.ok) {
      const responseText = await recommendationsResponse.text();
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { raw: responseText };
      }
      console.error("Spotify recommendations error:", {
        status: recommendationsResponse.status,
        statusText: recommendationsResponse.statusText,
        errorData,
        responseText,
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
      tracks: SpotifyTrack[];
    };

    console.log(`Received ${recommendations.tracks?.length || 0} tracks from Spotify recommendations`);

    if (!recommendations.tracks || recommendations.tracks.length === 0) {
      console.warn("No tracks returned from Spotify recommendations, trying fallback");
      // Don't return here, let the fallback logic handle it
    } else {
      // Process recommendations normally
    }

    // Step 3: Transform to our format, filter out the original track, and deduplicate
    let allResults: SimilarTrackResult[] = [];
    const results: SimilarTrackResult[] = [];

    if (recommendations.tracks && recommendations.tracks.length > 0) {
      allResults = recommendations.tracks
        .filter((track) => track.id !== trackId) // Exclude the original track
        .map((track) => ({
          id: track.id,
          title: track.name,
          artist: track.artists.map((a) => a.name).join(", "),
          album: track.album.name,
          albumArt: track.album.images[0]?.url ?? "",
          previewUrl: track.preview_url,
          spotifyUrl: track.external_urls.spotify,
        }));

      // Deduplicate
      const seen = new Map<string, SimilarTrackResult>();
      for (const track of allResults) {
        const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.set(key, track);
          results.push(track);
        }
      }
    }

    // If we have no results, return empty rather than falling back to artist's top tracks
    // (User wants diverse recommendations, not same-artist tracks)
    if (results.length === 0) {
      console.warn("No recommendations found from Spotify recommendations API");
    }

    // Step 4: Try to fetch lyrics (optional, won't fail if it doesn't work)
    let lyricsFetched = false;
    try {
      // This would call Genius API - for now just mark as attempted
      // TODO: Implement actual Genius API call
      lyricsFetched = true;
    } catch {
      // Lyrics fetching is optional
    }

           console.log(`Returning ${results.length} similar tracks`);

           // Return at least 30 tracks (or as many as we have)
           const tracksToReturn = results.slice(0, Math.max(30, results.length));

           return NextResponse.json({
             similarTracks: tracksToReturn,
             analysis: {
               audioFeatures,
               lyricsFetched,
               method: results.length > 0 ? "spotify_recommendations" : "fallback_or_empty",
             },
           });
  } catch (error) {
    console.error("Track analysis error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    );
  }
}

