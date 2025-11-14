"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button
        disabled
        className="rounded-full border border-slate-700 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-slate-400"
      >
        Loading…
      </button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-200">
        <span className="hidden sm:inline text-slate-400">
          {session.user.name ?? "Spotify User"}
        </span>
        <button
          onClick={() => signOut()}
          className="rounded-full border border-slate-600 px-4 py-1 transition hover:border-slate-400 hover:text-slate-100"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("spotify")}
      className="rounded-full border border-slate-600 px-4 py-1 text-xs uppercase tracking-[0.28em] text-slate-100 transition hover:border-slate-400 hover:text-slate-50"
    >
      Sign in
    </button>
  );
}