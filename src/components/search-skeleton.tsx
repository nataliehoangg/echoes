export function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-lg border border-slate-800/70 bg-slate-900/40 p-3"
        >
          <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-700" />
            <div className="h-3 w-1/2 rounded bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

