import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";

const YOUTUBE_VIDEO_ID = "HR9coYxhYKw";
const YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/" +
  YOUTUBE_VIDEO_ID +
  "?controls=1&loop=1&playlist=" + YOUTUBE_VIDEO_ID + "&playsinline=1&rel=0";

/**
 * Persistent Agnus Dei player. The minimized launcher stays beside the
 * mobile vertical-menu button; the iframe remains mounted while minimized.
 */
export function GlobalBackgroundMusic() {
  const [isMinimized, setIsMinimized] = useState(true);

  return (
    <aside
      aria-label="Música ambiente Agnus Dei"
      className={`fixed left-[3.75rem] right-auto z-40 overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xl transition-[width,top] duration-200 dark:border-slate-700 dark:bg-slate-900 ${
        isMinimized
          ? "top-[calc(env(safe-area-inset-top)+0.5rem)] w-11 rounded-full"
          : "top-[calc(env(safe-area-inset-top)+0.5rem)] w-[min(22rem,calc(100vw-5rem))]"
      }`}
    >
      <div className={`relative z-10 flex items-center gap-2 bg-white dark:bg-slate-900 ${isMinimized ? "justify-center p-0.5" : "px-3 py-2"}`}>
        {!isMinimized && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">Agnus Dei</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Depths of Worship · reprodução contínua</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsMinimized((current) => !current)}
          aria-label={isMinimized ? "Abrir player Agnus Dei" : "Minimizar player Agnus Dei"}
          aria-expanded={!isMinimized}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-slate-800"
        >
          {isMinimized ? <Play className="size-5 fill-current" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      <div
        className={`relative transition-[height] duration-200 ${isMinimized ? "max-h-0 overflow-hidden" : "h-[200px]"}`}
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
