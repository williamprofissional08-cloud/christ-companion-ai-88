import { useState } from "react";
import { Pause, Play } from "lucide-react";

const YOUTUBE_VIDEO_ID = "HR9coYxhYKw";
const YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/" +
  YOUTUBE_VIDEO_ID +
  "?autoplay=1&controls=0&loop=1&playlist=" +
  YOUTUBE_VIDEO_ID +
  "&playsinline=1&rel=0";

/**
 * Compact background-music control kept beside the mobile menu.
 * Playback starts only after an explicit user gesture. Unmounting the
 * iframe stops playback, so the same button reliably toggles play/pause.
 */
export function GlobalBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <aside aria-label="Música ambiente Agnus Dei">
      <button
        type="button"
        onClick={() => setIsPlaying((playing) => !playing)}
        aria-label={isPlaying ? "Pausar música ambiente" : "Reproduzir música ambiente"}
        aria-pressed={isPlaying}
        title={isPlaying ? "Pausar música" : "Reproduzir música"}
        className="fixed left-[3.75rem] top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 inline-flex size-10 items-center justify-center rounded-full border border-blue-200/80 bg-white text-blue-700 shadow-md transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
      >
        {isPlaying ? (
          <Pause className="size-5" aria-hidden="true" />
        ) : (
          <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
        )}
      </button>

      {isPlaying ? (
        <iframe
          key="agnus-dei-background-audio"
          title="Música ambiente Agnus Dei"
          src={YOUTUBE_EMBED_URL}
          className="pointer-events-none fixed -left-10 top-0 h-px w-px opacity-0"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : null}
    </aside>
  );
}
