import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";

const YOUTUBE_VIDEO_ID = "HR9coYxhYKw";
const YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/" +
  YOUTUBE_VIDEO_ID +
  "?controls=0&loop=1&playlist=" +
  YOUTUBE_VIDEO_ID +
  "&playsinline=1&rel=0&enablejsapi=1";

type MusicControls = {
  isReady: boolean;
  isPlaying: boolean;
  togglePlayback: () => void;
};

const MusicContext = createContext<MusicControls | null>(null);

const MUSIC_BUTTON_CLASSES =
  "shrink-0 items-center justify-center rounded-full border border-blue-200/80 bg-white text-blue-700 shadow-md transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800";

/** The control lives in the actual header, not in a detached fixed-position portal. */
export function MusicControlButton({ className = "" }: { className?: string }) {
  const music = useContext(MusicContext);
  if (!music) return null;

  return (
    <button
      type="button"
      onClick={music.togglePlayback}
      disabled={!music.isReady}
      aria-label={
        !music.isReady
          ? "Carregando música ambiente"
          : music.isPlaying
            ? "Pausar música ambiente"
            : "Reproduzir música ambiente"
      }
      aria-pressed={music.isPlaying}
      title={
        !music.isReady
          ? "Carregando música"
          : music.isPlaying
            ? "Pausar música"
            : "Reproduzir música"
      }
      className={`${MUSIC_BUTTON_CLASSES} ${className}`}
    >
      {music.isPlaying ? (
        <Pause className="size-5" aria-hidden="true" />
      ) : (
        <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * One persistent YouTube iframe for the entire authenticated route tree.
 * Controls may appear in the home header or elsewhere without remounting
 * the player or attempting playback before a user interaction.
 */
export function GlobalBackgroundMusic({ children }: { children: ReactNode }) {
  const playerRef = useRef<HTMLIFrameElement>(null);
  const location = useLocation();
  const isHome = location.pathname === "/inicio";
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const onYouTubeMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.youtube-nocookie.com" ||
        event.source !== playerRef.current?.contentWindow
      ) return;
      try {
        const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (message?.event !== "onStateChange") return;
        if (message.info === 1) setIsPlaying(true);
        if (message.info === 0 || message.info === 2) setIsPlaying(false);
      } catch {
        // Ignore unrelated player messages.
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
    <MusicContext.Provider value={{ isReady, isPlaying, togglePlayback }}>
      {children}
      {!isHome && (
        <MusicControlButton className="global-music-button inline-flex fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 size-10 lg:right-4" />
      )}
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
    </MusicContext.Provider>
  );
}
