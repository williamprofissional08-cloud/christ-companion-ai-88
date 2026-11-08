import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, SkipBack, SkipForward, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { buildLessonNarrationText } from "@/lib/school/professor-tts";
import type { LessonContentBlock } from "@/lib/school/lesson-view";

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const AUDIO_STOP_EVENT = "ccc:stop-audio";

type State = "ready" | "playing" | "paused" | "error" | "unsupported";

/**
 * Narração local via Web Speech API. A escolha evita uma segunda cópia do estudo,
 * custo por reprodução e envio de conteúdo (ou anotações privadas) a serviços externos.
 */
export function LessonNarrationPlayer({
  title,
  blocks,
  initialChunkIndex = 0,
  initialRate = 1,
  onCheckpoint,
}: {
  title: string;
  blocks: LessonContentBlock[];
  initialChunkIndex?: number;
  initialRate?: number;
  onCheckpoint?: (value: { audioChunkIndex: number; playbackRate: number }) => void;
}) {
  const script = useMemo(() => buildLessonNarrationText(title, blocks), [blocks, title]);
  const [state, setState] = useState<State>("unsupported");
  const [rate, setRate] = useState<(typeof RATES)[number]>(
    RATES.includes(initialRate as (typeof RATES)[number]) ? initialRate as (typeof RATES)[number] : 1,
  );
  const [position, setPosition] = useState(0);
  const [voiceLabel, setVoiceLabel] = useState("Voz do dispositivo");
  const indexRef = useRef(initialChunkIndex);
  const rateRef = useRef(rate);
  const runRef = useRef(0);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  const stop = () => {
    if (typeof window === "undefined") return;
    runRef.current += 1;
    window.speechSynthesis.cancel();
    indexRef.current = 0;
    setPosition(0);
    setState("ready");
  };

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setState("ready");
    const stopForOtherAudio = () => {
      runRef.current += 1;
      window.speechSynthesis.cancel();
      setState("ready");
    };
    window.addEventListener(AUDIO_STOP_EVENT, stopForOtherAudio);
    return () => {
      window.removeEventListener(AUDIO_STOP_EVENT, stopForOtherAudio);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  const startAt = (index: number) => {
    if (!script || typeof window === "undefined") return;
    window.dispatchEvent(new Event(AUDIO_STOP_EVENT));
    const synth = window.speechSynthesis;
    const run = ++runRef.current;
    const voices = synth.getVoices();
    const ptBr = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br"));
    const portuguese = ptBr ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
    setVoiceLabel(
      portuguese ? `${portuguese.name} (${portuguese.lang})` : "Voz padrão do dispositivo",
    );
    indexRef.current = index;
    const chunks = script.match(/[^.!?\n]+[.!?\n]*\s*/g) ?? [script];
    const grouped: string[] = [];
    let current = "";
    for (const chunk of chunks) {
      if (current.length + chunk.length > 550 && current) {
        grouped.push(current);
        current = "";
      }
      current += chunk;
    }
    if (current) grouped.push(current);
    index = Math.max(0, Math.min(grouped.length - 1, index));
    utterancesRef.current = grouped.map((text) => new SpeechSynthesisUtterance(text));
    const speak = (next: number) => {
      if (run !== runRef.current) return;
      const utterance = utterancesRef.current[next];
      if (!utterance) {
        setPosition(100);
        setState("ready");
        return;
      }
      indexRef.current = next;
      onCheckpoint?.({ audioChunkIndex: next, playbackRate: rateRef.current });
      utterance.lang = portuguese?.lang ?? "pt-BR";
      utterance.voice = portuguese ?? null;
      utterance.rate = rateRef.current;
      utterance.onstart = () => {
        if (run === runRef.current) setState("playing");
      };
      utterance.onend = () => {
        if (run !== runRef.current) return;
        setPosition(Math.round(((next + 1) / utterancesRef.current.length) * 100));
        speak(next + 1);
      };
      utterance.onerror = (event) => {
        if (run === runRef.current && event.error !== "canceled" && event.error !== "interrupted") {
          setState("error");
        }
      };
      synth.speak(utterance);
    };
    setPosition(Math.round((index / Math.max(grouped.length, 1)) * 100));
    speak(index);
  };

  const playPause = () => {
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
    } else {
      startAt(indexRef.current);
    }
  };

  const seekChunk = (delta: number) => {
    const count = utterancesRef.current.length || 1;
    const next = Math.max(0, Math.min(count - 1, indexRef.current + delta));
    window.speechSynthesis.cancel();
    startAt(next);
  };

  const setPlaybackRate = (value: (typeof RATES)[number]) => {
    rateRef.current = value;
    setRate(value);
    onCheckpoint?.({ audioChunkIndex: indexRef.current, playbackRate: value });
    if (state === "playing" || state === "paused") {
      const wasPaused = state === "paused";
      window.speechSynthesis.cancel();
      startAt(indexRef.current);
      if (wasPaused) window.speechSynthesis.pause();
    }
  };

  if (!script) return null;
  if (state === "unsupported") {
    return (
      <Card className="p-5 text-sm text-muted-foreground">
        A narração no navegador não é compatível com este dispositivo. Continue pela aba{" "}
        <strong>Ler aula</strong>.
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4 sm:p-5" aria-label="Narração da aula">
      <div className="flex flex-wrap items-center gap-2">
        <Headphones className="size-4 text-primary" aria-hidden />
        <h2 className="font-display text-base font-semibold">Ouvir esta aula</h2>
        <Badge variant="outline" className="ml-auto">
          {state === "playing" ? "Reproduzindo" : state === "paused" ? "Pausado" : "Pronto"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Narração local do conteúdo publicado da aula. {voiceLabel}.
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => seekChunk(-1)}
          aria-label="Voltar um trecho"
        >
          <SkipBack className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="size-11 rounded-full"
          onClick={playPause}
          aria-label={
            state === "playing"
              ? "Pausar narração"
              : state === "paused"
                ? "Continuar narração"
                : "Iniciar narração"
          }
        >
          {state === "playing" ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => seekChunk(1)}
          aria-label="Avançar um trecho"
        >
          <SkipForward className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={stop}
          aria-label="Parar e reiniciar narração"
        >
          <Square className="mr-1 size-4" />
          Parar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            stop();
            startAt(0);
          }}
          aria-label="Reiniciar narração"
        >
          <RotateCcw className="mr-1 size-4" />
          Reiniciar
        </Button>
      </div>
      <div className="space-y-1">
        <Slider
          value={[position]}
          max={100}
          step={1}
          onValueChange={([value]) => {
            const count = utterancesRef.current.length || 1;
            window.speechSynthesis.cancel();
            startAt(Math.round(((value ?? 0) / 100) * (count - 1)));
          }}
          aria-label="Progresso aproximado da narração"
        />
        <p className="text-right text-xs tabular-nums text-muted-foreground">{position}% narrado</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Velocidade</span>
        {RATES.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={rate === value ? "default" : "outline"}
            className="h-8 px-2.5 text-xs"
            onClick={() => setPlaybackRate(value)}
            aria-label={`Velocidade ${value}x`}
            aria-pressed={rate === value}
          >
            {value}x
          </Button>
        ))}
      </div>
      {state === "error" ? (
        <p role="alert" className="text-xs text-destructive">
          Não foi possível narrar este trecho. Tente reiniciar ou continue pela leitura.
        </p>
      ) : null}
    </Card>
  );
}
