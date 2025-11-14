"use client";

import { useState } from "react";
import { type SearchResult } from "@/app/api/search/route";
import { useSession } from "next-auth/react";

interface PlaylistModalProps {
  selectedTrack: SearchResult;
  similarTracks: SearchResult[];
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: (url: string) => void;
}

export function PlaylistModal({
  selectedTrack,
  similarTracks,
  isOpen,
  onClose,
  onPlaylistCreated,
}: PlaylistModalProps) {
  const { data: session } = useSession();
  const [playlistName, setPlaylistName] = useState(`${selectedTrack.title}_alikes`);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(
    new Set(similarTracks.map((t) => t.id)),
  );
  const [creating, setCreating] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleTrack = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleCreatePlaylist = async () => {
    if (!session?.accessToken || selectedTracks.size === 0) return;

    setCreating(true);
    try {
      const response = await fetch("/api/playlist/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selectedTrack.id,
          similarTrackIds: Array.from(selectedTracks),
          name: playlistName.trim() || `${selectedTrack.title}_alikes`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.playlistUrl) {
        setPlaylistUrl(data.playlistUrl);
        onPlaylistCreated?.(data.playlistUrl);
      } else {
        alert(data.error || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Playlist creation error:", error);
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-slate-800/70 bg-slate-900/95 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-200"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="mb-4 text-2xl font-semibold text-slate-100">
          Create Playlist
        </h2>

        {playlistUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700/70 bg-slate-800/40 p-4">
              <p className="mb-2 text-sm font-medium text-slate-300">
                Playlist created successfully!
              </p>
              <a
                href={playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-400 hover:text-sky-300"
              >
                Open in Spotify →
              </a>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Playlist Name
              </label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-800/40 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
                placeholder="Enter playlist name"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Tracks to Include ({selectedTracks.size} selected)
              </label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-700/70 bg-slate-800/40 p-2">
                {similarTracks.map((track) => (
                  <label
                    key={track.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-slate-700/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTracks.has(track.id)}
                      onChange={() => handleToggleTrack(track.id)}
                      className="h-4 w-4 rounded border-slate-600 text-sky-500 focus:ring-sky-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-100">
                        {track.title}
                      </p>
                      <p className="text-xs text-slate-400">{track.artist}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={creating || selectedTracks.size === 0}
                className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Playlist"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

