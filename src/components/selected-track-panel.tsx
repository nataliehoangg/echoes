"use client";

import Image from "next/image";
import { type SearchResult } from "@/app/api/search/route";

interface SelectedTrackPanelProps {
  track: SearchResult;
  onClear: () => void;
}

export function SelectedTrackPanel({ track, onClear }: SelectedTrackPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Selected Track</h2>
        <button
          onClick={onClear}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-64 w-64 overflow-hidden rounded-2xl">
          {track.albumArt ? (
            <Image
              src={track.albumArt}
              alt={`${track.album} cover`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-slate-800" />
          )}
        </div>
        <div className="w-full text-center">
          <h3 className="text-xl font-semibold text-slate-100">{track.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{track.artist}</p>
          <p className="mt-1 text-xs text-slate-500">{track.album}</p>
        </div>
        {track.previewUrl && (
          <audio
            controls
            src={track.previewUrl}
            className="w-full"
          >
            Your browser does not support the audio element.
          </audio>
        )}
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          Open in Spotify →
        </a>
      </div>
    </div>
  );
}

