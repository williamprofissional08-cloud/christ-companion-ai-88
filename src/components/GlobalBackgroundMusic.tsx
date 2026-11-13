import { useState } from "react";
import { ChevronDown, ChevronUp, Music2 } from "lucide-react";

const YOUTUBE_VIDEO_ID = "HR9coYxhYKw";
const YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/" +
  YOUTUBE_VIDEO_ID +
  "?controls=1&loop=1&playlist=" + YOUTUBE_VIDEO_ID + "&playsinline=1&rel=0";

/**
 * Persistent player for the artist's official Agnus Dei video.
 * The iframe stays mounted when collapsed so minimizing the UI does not
 * intentionally stop playback. YouTube remains responsible for looping.
 */
export function GlobalBackgroundMusic() {
  const [isMinimized, setIsMinimized] = useState(true);

  return (
    <aside
      aria-label="Música ambiente Agnus Dei"
      className={`fixed right-3 z-40 overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xl transition-[width,bottom] duration-200 sm:right-5 dark:border-slate-700 dark:bg-slate-900 ${
        isMinimized
          ? "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] w-48 sm:bottom-5"
          : "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] w-[min(22rem,calc(100vw-1.5rem))] sm:bottom-5"
      }`}
    >
      <div className="relative z-10 flex items-center gap-2 bg-white px-3 py-2 dark:bg-slate-900">
        <Music2 className="size-4 shrink-0 text-blue-700 dark:text-blue-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
            Agnus Dei
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {isMinimized ? "Player minimizado" : "Depths of Worship · reprodução contínua"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized((current) => !current)}
          aria-label={isMinimized ? "Expandir player Agnus Dei" : "Minimizar player Agnus Dei"}
          aria-expanded={!isMinimized}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
        >
          {isMinimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      <div
        className={`relative transition-[height] duration-200 ${
          isMinimized ? "h-0" : "h-[200px]"
        }`}
        aria-hidden={isMinimized}
      >
        <iframe
          title="Agnus Dei — Depths of Worship no YouTube"
          src={YOUTUBE_EMBED_URL}
          width="100%"
          height="200"
          style={{ border: 0, display: "block" }}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          allowFullScreen
          tabIndex={isMinimized ? -1 : 0}
        />
      </div>
    </aside>
  );
}
