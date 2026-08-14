/**
 * Player de áudio da aula (Escola Bíblica).
 * Aditivo: usado apenas na página da aula. O áudio é carregado sob demanda
 * (preload="none") e a posição pode ser reportada ao servidor pelo callback.
 */
import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { formatClock, PLAYBACK_RATES } from "@/lib/school/lesson-view";

type Props = {
  src: string;
  title: string;
  /** Posição salva anteriormente, em segundos. */
  startAt?: number;
  fallbackDuration?: number | null;
  onPosition?: (seconds: number) => void;
};

export function LessonAudioPlayer({ src, title, startAt = 0, fallbackDuration, onPosition }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(startAt);
  const [duration, setDuration] = useState(fallbackDuration ?? 0);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [resumed, setResumed] = useState(startAt < 5);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      onPosition?.(Math.floor(audio.currentTime));
      return;
    }
    if (!resumed && startAt > 0) {
      audio.currentTime = startAt;
      setResumed(true);
    }
    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrent(value);
  };

  const total = duration || fallbackDuration || 0;

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Headphones className="size-4 text-primary" aria-hidden />
        <h2 className="font-display text-base font-semibold">Ouvir esta aula</h2>
        <Badge variant="outline" className="ml-auto">
          Narração
        </Badge>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="none"
        aria-label={`Áudio da aula ${title}`}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(event) => {
          setPlaying(false);
          onPosition?.(Math.floor(event.currentTarget.currentTime));
        }}
      />

      {startAt > 5 && !resumed ? (
        <p className="text-xs text-muted-foreground">
          Você estava ouvindo em {formatClock(startAt)}. Toque em ouvir para continuar.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          onClick={() => void toggle()}
          aria-label={playing ? "Pausar áudio da aula" : "Ouvir áudio da aula"}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <div className="min-w-0 flex-1 space-y-1">
          <Slider
            value={[Math.min(current, total || current)]}
            max={total || Math.max(current, 1)}
            step={1}
            onValueChange={([value]) => seek(value ?? 0)}
            aria-label="Progresso do áudio"
          />
          <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{formatClock(current)}</span>
            <span>{total ? formatClock(total) : "--:--"}</span>
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 shrink-0"
          onClick={() => seek(Math.max(0, current - 15))}
          aria-label="Voltar 15 segundos"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Velocidade</span>
          {PLAYBACK_RATES.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={rate === value ? "default" : "outline"}
              className="h-8 px-2.5 text-xs"
              onClick={() => setRate(value)}
              aria-label={`Velocidade ${value}x`}
              aria-pressed={rate === value}
            >
              {value}x
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:w-40">
          <Volume2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Slider
            value={[Math.round(volume * 100)]}
            max={100}
            step={5}
            onValueChange={([value]) => setVolume((value ?? 100) / 100)}
            aria-label="Volume"
          />
        </div>
      </div>
    </Card>
  );
}
