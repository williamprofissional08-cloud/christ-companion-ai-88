import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const YOUTUBE_VIDEO_ID = "HR9coYxhYKw";
const YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/" +
  YOUTUBE_VIDEO_ID +
  "?controls=0&loop=1&playlist=" +
  YOUTUBE_VIDEO_ID +
  "&playsinline=1&rel=0&enablejsapi=1";

/**
 * Compact background music control.
 * Keep the YouTube iframe mounted so playback commands are sent from the
 * actual user click, which is more reliable on Safari/iOS than mounting an
 * autoplay iframe after a React state update.
 */
export function GlobalBackgroundMusic() {
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const onYouTubeMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube-nocookie.com" ||
          event.source !== playerRef.current?.contentWindow) return;
      try {
        const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (message?.event !== "onStateChange") return;
        if (message.info === 1) setIsPlaying(true);
        if (message.info === 0 || message.info === 2) setIsPlaying(false);
      } catch {
        // Ignore non-player messages.
      }
    };
    window.addEventListener("message", onYouTubeMessage);
    return () => window.removeEventListener("message", onYouTubeMessage);
  }, []);

  function togglePlayback() {
    const player = playerRef.current?.contentWindow;
    if (!player || !isReady) return;

    const nextIsPlaying = !isPlaying;
    player.postMessage(
      JSON.stringify({
        event: "command",
        func: nextIsPlaying ? "playVideo" : "pauseVideo",
        args: [],
      }),
      "https://www.youtube-nocookie.com",
    );
    setIsPlaying(nextIsPlaying);
  }

  return (
    <aside aria-label="Música ambiente Agnus Dei" className="contents">
      <button
        type="button"
        onClick={togglePlayback}
        disabled={!isReady}
        aria-label={
          !isReady
            ? "Carregando música ambiente"
            : isPlaying
              ? "Pausar música ambiente"
              : "Reproduzir música ambiente"
        }
        aria-pressed={isPlaying}
        title={
          !isReady
            ? "Carregando música"
            : isPlaying
              ? "Pausar música"
              : "Reproduzir música"
        }
        className="global-music-button fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 lg:right-4 inline-flex size-10 items-center justify-center rounded-full border border-blue-200/80 bg-white text-blue-700 shadow-md transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
      >
        {isPlaying ? (
          <Pause className="size-5" aria-hidden="true" />
        ) : (
          <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
        )}
      </button>

      <iframe
        ref={playerRef}
        title="Música ambiente Agnus Dei"
        src={YOUTUBE_EMBED_URL}
        onLoad={() => setIsReady(true)}
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-[200px] w-[200px] opacity-0"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="eager"
        tabIndex={-1}
        aria-hidden="true"
      />
    </aside>
  );
}
