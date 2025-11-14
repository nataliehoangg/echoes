"use client";

interface WeightSlidersProps {
  lyricsWeight: number;
  audioWeight: number;
  spotifyWeight: number;
  onWeightsChange: (weights: {
    lyrics: number;
    audio: number;
    spotify: number;
  }) => void;
}

export function WeightSliders({
  lyricsWeight,
  audioWeight,
  spotifyWeight,
  onWeightsChange,
}: WeightSlidersProps) {
  const handleChange = (
    type: "lyrics" | "audio" | "spotify",
    value: number,
  ) => {
    const newWeights = {
      lyrics: lyricsWeight,
      audio: audioWeight,
      spotify: spotifyWeight,
    };
    newWeights[type] = value;

    // Normalize weights to sum to 1
    const total = newWeights.lyrics + newWeights.audio + newWeights.spotify;
    if (total > 0) {
      newWeights.lyrics /= total;
      newWeights.audio /= total;
      newWeights.spotify /= total;
    }

    onWeightsChange(newWeights);
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-800/70 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-slate-200">
        Similarity Weights
      </h3>
      <p className="text-xs text-slate-400">
        Adjust how much each factor influences recommendations
      </p>

      <div className="space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Lyrics
            </label>
            <span className="text-xs text-slate-400">
              {Math.round(lyricsWeight * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={lyricsWeight}
            onChange={(e) => handleChange("lyrics", parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-sky-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Meaning and emotional content
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Melody
            </label>
            <span className="text-xs text-slate-400">
              {Math.round(audioWeight * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioWeight}
            onChange={(e) => handleChange("audio", parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-purple-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Musical structure and sound
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Vibe</label>
            <span className="text-xs text-slate-400">
              {Math.round(spotifyWeight * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={spotifyWeight}
            onChange={(e) => handleChange("spotify", parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-pink-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Energy, danceability, mood
          </p>
        </div>
      </div>
    </div>
  );
}

