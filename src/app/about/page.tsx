import { Navbar } from "@/components/navbar";
import { AnimatedText } from "@/components/ui/animated-shiny-text";
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <InteractiveNebulaShader className="z-0 opacity-90" />
      <Navbar />
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24 pt-36 sm:px-10 lg:px-16 lg:pt-40">
        <section className="mx-auto w-full max-w-4xl space-y-8 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-8 text-pretty text-slate-300 backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-center space-y-4 text-center sm:space-y-6">
            <AnimatedText
              text="Why Echoes Exists"
              gradientColors="linear-gradient(120deg, rgba(14,165,233,1), rgba(192,132,252,1), rgba(14,165,233,1))"
              textClassName="text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] font-semibold tracking-tight"
              className="py-0"
            />
            <p className="max-w-2xl text-sm font-semibold uppercase tracking-[0.35em] text-slate-300">
              Built for listeners who live inside their music
            </p>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-200 sm:text-xl">
              Echoes is the discovery engine for people who replay tracks hundreds of times and dissect
              every lyric. We built it to understand the full emotional architecture of a song—melody,
              meaning, and the way it feels to press play.
            </p>
          </div>
          <div className="space-y-6 text-left text-base leading-relaxed text-slate-300 sm:text-lg">
            <p>
              The system analyzes lyrics to surface themes, emotional weight, and narrative depth. It layers that
              with timbral fingerprints, rhythmic DNA, and vocal texture extracted from the audio itself. Spotify
              sentiment features like valence, energy, and danceability tie everything together into a multi-dimensional
              profile of how the song resonates.
            </p>
            <p>
              Each of those signals feeds a weighted similarity score stored in a vector database. When you search for a
              track, Echoes runs a nearest-neighbor search across thousands of embeddings to find songs that align with
              both the story and the sound. With one click, we generate an `_alikes` playlist in your Spotify account—
              crafted not by genre adjacency but by emotional kinship.
            </p>
            <p>
              Echoes is for the listeners who feel music deeply, who want technology to meet them at that level of obsession.
              This is discovery for people who live inside their favorite songs.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

