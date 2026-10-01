/**
 * Botão discreto de áudio (TTS) para cada resposta do Professor IA (Dia 8).
 * Aditivo: não altera a resposta escrita nem a lógica do chat.
 * O áudio só é gerado quando o aluno toca em "Ouvir resposta".
 */
import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildSpeechText, chunkSpeechText, TTS_LABELS } from "@/lib/school/professor-tts";

type State = "idle" | "loading" | "playing" | "paused" | "error";

/** Cache de áudios já gerados nesta sessão (evita gerar o mesmo texto de novo). */
const sessionCache = new Map<string, string[]>();

export function ProfessorAnswerAudio({ messageId, text }: { messageId: string; text: string }) {
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState<string>(TTS_LABELS.error);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    const stopForOtherAudio = () => audioRef.current?.pause();
    window.addEventListener("ccc:stop-audio", stopForOtherAudio);
    return () => {
      window.removeEventListener("ccc:stop-audio", stopForOtherAudio);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function playFrom(index: number) {
    const urls = urlsRef.current;
    if (index >= urls.length) {
      setState("idle");
      indexRef.current = 0;
      return;
    }
    indexRef.current = index;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }
    audio.onended = () => playFrom(indexRef.current + 1);
    audio.onerror = () => setState("error");
    audio.src = urls[index]!;
    void audio
      .play()
      .then(() => setState("playing"))
      .catch(() => setState("error"));
  }

  async function generate(): Promise<string[]> {
    const cached = sessionCache.get(messageId);
    if (cached) return cached;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const chunks = chunkSpeechText(buildSpeechText(text));
    if (!chunks.length) throw new Error("empty");

    const urls: string[] = [];
    for (const chunk of chunks) {
      const response = await fetch("/api/escola/professor-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: chunk }),
      });
      if (response.status === 402) throw new Error("credits");
      if (!response.ok) throw new Error(`tts ${response.status}`);
      urls.push(URL.createObjectURL(await response.blob()));
    }
    sessionCache.set(messageId, urls);
    return urls;
  }

  async function handleMain() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("paused");
      return;
    }
    if (state === "paused") {
      void audioRef.current
        ?.play()
        .then(() => setState("playing"))
        .catch(() => setState("error"));
      return;
    }
    setState("loading");
    try {
      window.dispatchEvent(new Event("ccc:stop-audio"));
      urlsRef.current = await generate();
      playFrom(0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message === "credits"
          ? "A narração está temporariamente indisponível. Tente novamente mais tarde."
          : TTS_LABELS.error,
      );
      setState("error");
    }
  }

  function handleStop() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    indexRef.current = 0;
    setState("idle");
  }

  const label =
    state === "loading"
      ? TTS_LABELS.loading
      : state === "playing"
        ? TTS_LABELS.playing
        : state === "paused"
          ? TTS_LABELS.paused
          : TTS_LABELS.idle;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 gap-1.5 px-2 text-xs text-muted-foreground"
        disabled={state === "loading"}
        onClick={() => void handleMain()}
        aria-label={label}
      >
        {state === "loading" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : state === "playing" ? (
          <Pause className="size-4" aria-hidden />
        ) : state === "paused" ? (
          <Play className="size-4" aria-hidden />
        ) : (
          <Volume2 className="size-4" aria-hidden />
        )}
        {label}
      </Button>

      {state === "playing" || state === "paused" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={handleStop}
          aria-label={TTS_LABELS.stop}
        >
          <Square className="size-4" aria-hidden />
          {TTS_LABELS.stop}
        </Button>
      ) : null}

      {state === "error" ? <span className="text-xs text-destructive">{errorMessage}</span> : null}
    </div>
  );
}
