"use client";

import Image from "next/image";
import { type SearchResult } from "@/app/api/search/route";

interface TrackCardProps {
  track: SearchResult;
  onSelect: (track: SearchResult) => void;
}

export function TrackCard({ track, onSelect }: TrackCardProps) {
  return (
    <button
      onClick={() => onSelect(track)}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-left transition hover:border-slate-700 hover:bg-slate-900/80"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
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
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-slate-100 group-hover:text-slate-50">
          {track.title}
        </h3>
        <p className="truncate text-sm text-slate-400">{track.artist}</p>
        <p className="truncate text-xs text-slate-500">{track.album}</p>
      </div>
      {track.previewUrl && (
        <div className="flex-shrink-0">
          <span className="text-xs text-slate-500">▶</span>
        </div>
      )}
    </button>
  );
}

