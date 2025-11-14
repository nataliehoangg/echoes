"use client";

import { useState } from "react";
import { TrackCard } from "@/components/track-card";
import { type SearchResult } from "@/app/api/search/route";
import { useSession } from "next-auth/react";
import { PlaylistModal } from "@/components/playlist-modal";

interface SimilarTracksPanelProps {
  selectedTrack: SearchResult;
  similarTracks: SearchResult[];
  analyzing?: boolean;
  onTrackSelect: (track: SearchResult) => void;
}

export function SimilarTracksPanel({
  selectedTrack,
  similarTracks,
  analyzing = false,
  onTrackSelect,
}: SimilarTracksPanelProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">
          Similar Tracks
        </h2>
        {similarTracks.length > 0 && session?.accessToken && (
          <button
            onClick={() => setShowModal(true)}
            disabled={!!playlistUrl}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-50"
          >
            {playlistUrl ? "Created!" : "Create Playlist"}
          </button>
        )}
      </div>

      {playlistUrl && (
        <div className="mb-4 rounded-lg border border-slate-700/70 bg-slate-800/40 p-3">
          <p className="mb-2 text-sm text-slate-300">Playlist created!</p>
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            Open in Spotify →
          </a>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {analyzing ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-400" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">
                  Analyzing &quot;{selectedTrack.title}&quot;
                </p>
                <p className="text-xs text-slate-500">
                  Fetching lyrics, extracting audio features, and finding similar tracks...
                </p>
              </div>
            </div>
          </div>
        ) : similarTracks.length > 0 ? (
          similarTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onSelect={onTrackSelect}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                No similar tracks found
              </p>
              <p className="text-xs text-slate-500">
                The analysis completed but no recommendations were returned. This might be due to Spotify API limitations or the track not having enough data.
              </p>
            </div>
          </div>
        )}
      </div>

      <PlaylistModal
        selectedTrack={selectedTrack}
        similarTracks={similarTracks}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onPlaylistCreated={(url) => {
          setPlaylistUrl(url);
          setShowModal(false);
        }}
      />
    </div>
  );
}

