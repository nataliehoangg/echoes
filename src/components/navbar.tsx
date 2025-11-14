import Link from "next/link";
import { AuthButtons } from "@/components/auth-buttons";

export function Navbar() {
  return (
    <header className="fixed left-1/2 top-6 z-50 w-[min(92vw,960px)] -translate-x-1/2 rounded-full border border-slate-800/50 bg-slate-950/60 px-6 py-3 shadow-lg backdrop-blur-2xl">
      <nav className="flex items-center justify-between text-sm uppercase tracking-[0.28em] text-slate-300">
        <Link href="/" className="font-semibold text-slate-100 transition hover:text-slate-50">
          echoes
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="rounded-full px-4 py-1 transition hover:text-slate-100"
          >
            About
          </Link>
          <AuthButtons />
        </div>
      </nav>
    </header>
  );
}