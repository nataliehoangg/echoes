"use client";

import Image from "next/image";
import { type SearchResult } from "@/app/api/search/route";
import { SearchSkeleton } from "./search-skeleton";

interface SearchSuggestionsProps {
  suggestions: SearchResult[];
  onSelect: (track: SearchResult) => void;
  visible: boolean;
  loading?: boolean;
}

export function SearchSuggestions({
  suggestions,
  onSelect,
  visible,
  loading = false,
}: SearchSuggestionsProps) {
  if (!visible) return null;

  return (
    <div className="absolute top-full z-50 mt-2 w-full max-w-xl rounded-2xl border border-slate-800/70 bg-slate-900/95 backdrop-blur-xl shadow-xl">
      <div className="max-h-96 space-y-1 overflow-y-auto p-2">
        {loading ? (
          <SearchSkeleton />
        ) : suggestions.length > 0 ? (
          suggestions.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelect(track)}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-slate-800/60"
            >
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
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
                <p className="truncate text-sm font-medium text-slate-100">
                  {track.title}
                </p>
                <p className="truncate text-xs text-slate-400">{track.artist}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-slate-400">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}

