import { Music2 } from "lucide-react";

const YOUTUBE_VIDEO_ID = "HR9coYxhYKw";
const YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/" +
  YOUTUBE_VIDEO_ID +
  "?controls=1&loop=1&playlist=" + YOUTUBE_VIDEO_ID + "&playsinline=1&rel=0";

/**
 * Persistent player for the artist's official Agnus Dei video.
 *
 * YouTube's official embed handles playback and looping; the app does not
 * download, extract, or re-host the recording. Keeping the player mounted
 * and visible in the authenticated layout allows playback across route changes.
 * The listener must press Play because browser autoplay is not guaranteed.
 */
export function GlobalBackgroundMusic() {
  return (
    <aside
      aria-label="Música ambiente Agnus Dei"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xl sm:bottom-5 sm:right-5 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Music2 className="size-4 shrink-0 text-blue-700 dark:text-blue-300" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
            Agnus Dei
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            Depths of Worship · reprodução contínua
          </p>
        </div>
      </div>
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
      />
    </aside>
  );
}
