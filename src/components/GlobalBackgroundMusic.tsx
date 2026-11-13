import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";

const AUDIO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/6/63/Missa_Papae_Marcelli_-_VI._Agnus_Dei_II.flac";
const PLAYBACK_KEY = "ccc-background-music-enabled";
const VOLUME_KEY = "ccc-background-music-volume";
const STOP_AUDIO_EVENT = "ccc:stop-audio";
const PLAYER_SOURCE = "background-music";

/**
 * Música ambiente global do app autenticado.
 *
 * A gravação é CC0 (domínio público) e está hospedada no Wikimedia Commons.
 * O áudio vive no layout autenticado, portanto não reinicia ao trocar de rota.
 * A reprodução automática é apenas uma tentativa: navegadores que bloqueiam
 * autoplay recebem um controle explícito para iniciar após interação do usuário.
 */
export function GlobalBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [volume, setVolume] = useState(0.12);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let shouldPlay = true;
    let initialVolume = 0.12;

    try {
      shouldPlay = window.localStorage.getItem(PLAYBACK_KEY) !== "false";
      const storedVolumeValue = window.localStorage.getItem(VOLUME_KEY);
      if (storedVolumeValue !== null) {
        const storedVolume = Number(storedVolumeValue);
        if (Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1) {
          initialVolume = storedVolume;
        }
      }
    } catch {
      // O player continua funcional mesmo quando o armazenamento está indisponível.
    }

    setEnabled(shouldPlay);
    setVolume(initialVolume);
    audio.volume = initialVolume;

    const stopForForegroundAudio = (event: Event) => {
      const detail = (event as CustomEvent<{ source?: string }>).detail;
      if (detail?.source === PLAYER_SOURCE) return;
      audio.pause();
      setPlaying(false);
    };

    window.addEventListener(STOP_AUDIO_EVENT, stopForForegroundAudio);

    if (shouldPlay) {
      void audio
        .play()
        .then(() => {
          setBlocked(false);
          window.dispatchEvent(
            new CustomEvent(STOP_AUDIO_EVENT, { detail: { source: PLAYER_SOURCE } }),
          );
        })
        .catch(() => {
          setBlocked(true);
          setPlaying(false);
        });
    }

    return () => {
      window.removeEventListener(STOP_AUDIO_EVENT, stopForForegroundAudio);
      audio.pause();
    };
  }, []);

  const rememberEnabled = (value: boolean) => {
    setEnabled(value);
    try {
      window.localStorage.setItem(PLAYBACK_KEY, String(value));
    } catch {
      // A preferência fica ativa durante esta sessão mesmo sem localStorage.
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      rememberEnabled(false);
      setBlocked(false);
      return;
    }

    rememberEnabled(true);
    try {
      await audio.play();
      setBlocked(false);
      window.dispatchEvent(
        new CustomEvent(STOP_AUDIO_EVENT, { detail: { source: PLAYER_SOURCE } }),
      );
    } catch {
      setBlocked(true);
      setPlaying(false);
    }
  };

  const changeVolume = (value: number) => {
    const nextVolume = Math.max(0, Math.min(1, value));
    setVolume(nextVolume);
    if (audioRef.current) audioRef.current.volume = nextVolume;
    try {
      window.localStorage.setItem(VOLUME_KEY, String(nextVolume));
    } catch {
      // O volume continua aplicado ao elemento de áudio nesta sessão.
    }
  };

  return (
    <aside
      aria-label="Música ambiente"
      className="fixed bottom-20 right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-blue-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 lg:bottom-5 lg:right-5"
    >
      <audio
        ref={audioRef}
        src={AUDIO_URL}
        preload="none"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setBlocked(true);
        }}
      />

      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <Music2 className="size-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            Agnus Dei
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Palestrina · música ambiente
          </p>
        </div>

        <button
          type="button"
          onClick={() => void togglePlayback()}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label={playing ? "Pausar música ambiente" : "Reproduzir música ambiente"}
          aria-pressed={playing}
        >
          {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {volume === 0 ? (
          <VolumeX className="size-4 shrink-0 text-slate-500" aria-hidden />
        ) : (
          <Volume2 className="size-4 shrink-0 text-slate-500" aria-hidden />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => changeVolume(Number(event.currentTarget.value))}
          aria-label="Volume da música ambiente"
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-blue-700"
        />
        <span className="w-8 text-right text-[10px] tabular-nums text-slate-500">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {blocked && enabled ? (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
          Toque em reproduzir para iniciar. O navegador bloqueou a reprodução automática.
        </p>
      ) : null}

      {!enabled ? (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Música pausada. Sua preferência será respeitada na próxima visita.
        </p>
      ) : null}

      <a
        href="https://commons.wikimedia.org/wiki/File:Missa_Papae_Marcelli_-_VI._Agnus_Dei_II.flac"
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-[10px] text-slate-400 underline-offset-2 hover:underline"
      >
        Gravação CC0 · detalhes da licença
      </a>
    </aside>
  );
}
