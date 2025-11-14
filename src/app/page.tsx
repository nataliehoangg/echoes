"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { AnimatedText } from "@/components/ui/animated-shiny-text";
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";
import { SearchSuggestions } from "@/components/search-suggestions";
import { SelectedTrackPanel } from "@/components/selected-track-panel";
import { SimilarTracksPanel } from "@/components/similar-tracks-panel";
import { WeightSliders } from "@/components/weight-sliders";
import { ErrorBoundary } from "@/components/error-boundary";
import { type SearchResult } from "@/app/api/search/route";

export default function Home() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SearchResult | null>(null);
  const [similarTracks, setSimilarTracks] = useState<SearchResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weights, setWeights] = useState({ lyrics: 0.5, audio: 0.35, spotify: 0.15 });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search for suggestions as user types
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 2) {
      setShowSuggestions(true);
      setSuggestionsLoading(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await response.json();

          if (response.ok) {
            setSuggestions(data.results?.slice(0, 5) || []);
          } else {
            setSuggestions([]);
          }
        } catch {
          setSuggestions([]);
        } finally {
          setSuggestionsLoading(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedTrack(null);
    setSimilarTracks([]);
    setShowSuggestions(false);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      const results = data.results || [];
      if (results.length === 0) {
        setError("No tracks found. Try a different search.");
      } else {
        // Auto-select first result and trigger analysis
        const track = results[0];
        setSelectedTrack(track);
        setSimilarTracks([]);
        // Trigger similarity analysis with weights
        analyzeTrack(track.id, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const analyzeTrack = async (trackId: string, useWeights = false) => {
    setAnalyzing(true);
    setError(null);
    try {
      // Use weighted recommendations if weights are available, otherwise use basic analysis
      let endpoint = useWeights ? "/api/recommend" : "/api/track/analyze";
      let body = useWeights
        ? { trackId, limit: 30, weights }
        : { trackId };

      let response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // If recommend route fails with 500 or other server error, fall back to analyze route
      if (useWeights && !response.ok && response.status >= 500) {
        console.warn("Recommend route failed, falling back to analyze route");
        endpoint = "/api/track/analyze";
        body = { trackId };
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      let data;
      // Clone response before reading to allow fallback to text if JSON fails
      const clonedResponse = response.clone();
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails, try to read as text
        try {
          const text = await clonedResponse.text();
          console.error("Failed to parse response as JSON:", text);
          // Try to parse as JSON from text (in case it's JSON but with wrong content-type)
          try {
            data = JSON.parse(text);
          } catch {
            // Not JSON, use the text as error message
            setError(`Server error: ${text || response.statusText}`);
            setSimilarTracks([]);
            setAnalyzing(false);
            return;
          }
        } catch {
          console.error("Failed to read response body");
          setError(`Server error: ${response.status} ${response.statusText}`);
          setSimilarTracks([]);
          setAnalyzing(false);
          return;
        }
      }

      if (response.ok) {
        // Handle both response formats
        const tracks = data.similarTracks || data.recommendations || [];
        if (tracks.length > 0) {
          // Map recommendations to SearchResult format if needed
          const mappedTracks: SearchResult[] = tracks.map((t: SearchResult | { id: string; title: string; artist: string; album: string; albumArt: string; previewUrl: string | null; spotifyUrl: string }) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            albumArt: t.albumArt,
            previewUrl: t.previewUrl,
            spotifyUrl: t.spotifyUrl,
          }));
          setSimilarTracks(mappedTracks);
        } else {
          setError("No similar tracks found. Try a different song.");
          setSimilarTracks([]);
        }
      } else {
        // Better error message extraction
        const errorMsg =
          data?.error ||
          data?.message ||
          data?.details?.error ||
          (data && Object.keys(data).length > 0
            ? JSON.stringify(data)
            : `Analysis failed (${response.status} ${response.statusText})`);
        setError(errorMsg);
        console.error("Analysis failed:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          data: data || "No data in response",
          dataString: JSON.stringify(data),
        });
        setSimilarTracks([]);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Network error";
      setError(errorMsg);
      console.error("Analysis error:", err);
      setSimilarTracks([]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSuggestionSelect = (track: SearchResult) => {
    setQuery(`${track.title} ${track.artist}`);
    setShowSuggestions(false);
    setSelectedTrack(track);
    setSimilarTracks([]);
    analyzeTrack(track.id);
  };

  return (
    <ErrorBoundary>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
        <InteractiveNebulaShader className="z-0 opacity-90" />
        <Navbar />
      <main className="relative z-10 flex flex-1 flex-col px-6 pb-24 pt-36 sm:px-10 lg:px-16 lg:pt-40">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center space-y-8 text-center">
          <AnimatedText
            text="Echoes"
            hoverEffect
            gradientColors="linear-gradient(120deg, rgba(14,165,233,1), rgba(192,132,252,1), rgba(14,165,233,1))"
            textClassName="font-semibold tracking-tight"
            className="py-0"
          />
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            Find music that feels like your favorite song.
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-slate-300 sm:text-xl">
            Echoes blends lyric intent, melodic fingerprint, and Spotify audio
            sentiment to surface songs that resonate the way your go-to track
            does. It understands the story behind the sound.
          </p>
          <form
            onSubmit={handleSearch}
            className="relative mx-auto mt-8 flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row"
          >
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow suggestion click to register
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search for a song or paste a Spotify link"
                className="w-full rounded-full border border-slate-700/70 bg-slate-900/60 px-6 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                disabled={loading}
              />
              <SearchSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                visible={showSuggestions && !loading}
                loading={suggestionsLoading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full rounded-full bg-slate-100 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {!loading && !error && !selectedTrack && (
            <p className="text-sm text-slate-400">
              Sign in with Spotify to search. We&apos;ll analyze lyrics, melody,
              and vibe to craft your `_alikes` playlist.
            </p>
          )}

          {selectedTrack && (
            <div className="mt-12 w-full max-w-7xl animate-[fadeIn_0.5s_ease-in-out] opacity-0 [animation-fill-mode:forwards]">
              <div className="mb-6">
                <WeightSliders
                  lyricsWeight={weights.lyrics}
                  audioWeight={weights.audio}
                  spotifyWeight={weights.spotify}
                  onWeightsChange={(newWeights) => {
                    setWeights(newWeights);
                    // Re-analyze with new weights
                    analyzeTrack(selectedTrack.id, true);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SelectedTrackPanel
                  track={selectedTrack}
                  onClear={() => {
                    setSelectedTrack(null);
                    setSimilarTracks([]);
                    setQuery("");
                  }}
                />
                <SimilarTracksPanel
                  selectedTrack={selectedTrack}
                  similarTracks={similarTracks}
                  analyzing={analyzing}
                  onTrackSelect={(track) => {
                    setSelectedTrack(track);
                    setSimilarTracks([]);
                    analyzeTrack(track.id, true);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  );
}
