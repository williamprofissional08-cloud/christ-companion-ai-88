import { useState } from "react";
import { Music2, X } from "lucide-react";

const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/album/37WOTFMwBPcaY5REpVEApw?utm_source=generator&theme=0";

/**
 * Compact, persistent music launcher for the official Depths of Worship release.
 *
 * The player is supplied by Spotify's official embed, not copied or re-hosted.
 * It stays mounted in the authenticated layout so route changes do not interrupt
 * playback. Spotify/browser policy requires the listener to press Play; autoplay
 * cannot be guaranteed from a third-party embed.
 */
export function GlobalBackgroundMusic() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      aria-label="Música ambiente Agnus Dei"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-3 z-40 flex flex-col items-end gap-2 sm:bottom-5 sm:right-5"
    >
      {expanded ? (
        <section className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Music2 className="size-4 shrink-0 text-blue-700 dark:text-blue-300" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Agnus Dei
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  Depths of Worship
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800"
              aria-label="Recolher player de música"
            >
              <X className="size-4" />
            </button>
          </div>
          <iframe
            title="Agnus Dei — Depths of Worship no Spotify"
            src={SPOTIFY_EMBED_URL}
            width="100%"
            height="152"
            style={{ border: 0, display: "block" }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex h-11 items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-3 text-blue-800 shadow-lg backdrop-blur transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900/95 dark:text-blue-200 dark:hover:bg-slate-800"
        aria-expanded={expanded}
        aria-label={expanded ? "Fechar música ambiente" : "Abrir música ambiente"}
      >
        <Music2 className="size-4" aria-hidden />
        <span className="text-xs font-semibold">Agnus Dei</span>
      </button>
    </aside>
  );
}
