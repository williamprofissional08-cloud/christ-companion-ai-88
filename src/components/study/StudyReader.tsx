import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Headphones,
  ListTree,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useSyncedTTS } from "@/hooks/useSyncedTTS";
import { cn } from "@/lib/utils";
import {
  buildSpeechUnits,
  confidenceLabel,
  STUDY_PLAYBACK_RATES,
  type StudyDepth,
  type StudyPlaybackRate,
  type StudySection,
} from "@/lib/study-reader";

export type ReaderCheckpoint = {
  readPercent: number;
  lastSectionIndex: number;
  audioChunkIndex: number;
  playbackRate: StudyPlaybackRate;
};

type Props = {
  title: string;
  reference?: string | null;
  depth?: StudyDepth;
  sections: StudySection[];
  initialCheckpoint?: Partial<ReaderCheckpoint>;
  onCheckpoint?: (checkpoint: ReaderCheckpoint) => void;
};

const CONFIDENCE_CLASSES = {
  high: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  probable: "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-300",
  debated: "border-orange-600/30 bg-orange-600/10 text-orange-700 dark:text-orange-300",
  uncertain: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

function normalizeRate(value: number | undefined): StudyPlaybackRate {
  return STUDY_PLAYBACK_RATES.includes(value as StudyPlaybackRate)
    ? (value as StudyPlaybackRate)
    : 1;
}

export function StudyReader({
  title,
  reference,
  depth = "simple",
  sections,
  initialCheckpoint,
  onCheckpoint,
}: Props) {
  const speechUnits = useMemo(() => buildSpeechUnits(sections), [sections]);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeSection, setActiveSection] = useState(
    Math.min(initialCheckpoint?.lastSectionIndex ?? 0, Math.max(0, sections.length - 1)),
  );
  const [readPercent, setReadPercent] = useState(initialCheckpoint?.readPercent ?? 0);
  const [scope, setScope] = useState<"all" | "section">("all");
  const [tocOpen, setTocOpen] = useState(false);
  const checkpointRef = useRef<ReaderCheckpoint>({
    readPercent: initialCheckpoint?.readPercent ?? 0,
    lastSectionIndex: initialCheckpoint?.lastSectionIndex ?? 0,
    audioChunkIndex: initialCheckpoint?.audioChunkIndex ?? 0,
    playbackRate: normalizeRate(initialCheckpoint?.playbackRate),
  });

  const saveCheckpoint = useCallback(
    (patch: Partial<ReaderCheckpoint>) => {
      checkpointRef.current = { ...checkpointRef.current, ...patch };
      onCheckpoint?.(checkpointRef.current);
    },
    [onCheckpoint],
  );

  const tts = useSyncedTTS({
    units: speechUnits,
    initialUnit: initialCheckpoint?.audioChunkIndex ?? 0,
    initialRate: normalizeRate(initialCheckpoint?.playbackRate),
    onUnitChange: (unitIndex, sectionIndex) => {
      setActiveSection(sectionIndex);
      saveCheckpoint({ audioChunkIndex: unitIndex, lastSectionIndex: sectionIndex });
      sectionRefs.current[sectionIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    onRateChange: (playbackRate) => saveCheckpoint({ playbackRate }),
  });

  const goToSection = useCallback(
    (index: number) => {
      const safe = Math.max(0, Math.min(sections.length - 1, index));
      setActiveSection(safe);
      saveCheckpoint({ lastSectionIndex: safe });
      sectionRefs.current[safe]?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    },
    [saveCheckpoint, sections.length],
  );

  const play = () => {
    if (scope === "section") {
      const firstUnit = speechUnits.findIndex((unit) => unit.sectionIndex === activeSection);
      if (firstUnit >= 0) tts.seek(firstUnit);
      return;
    }
    tts.play();
  };

  const seekUnit = (delta: number) => {
    let next = Math.max(0, Math.min(speechUnits.length - 1, tts.unitIndex + delta));
    if (scope === "section") {
      const indices = speechUnits
        .map((unit, index) => (unit.sectionIndex === activeSection ? index : -1))
        .filter((index) => index >= 0);
      if (indices.length) {
        next = Math.max(indices[0] ?? 0, Math.min(indices[indices.length - 1] ?? 0, next));
      }
    }
    tts.seek(next);
  };

  useEffect(() => {
    let pending = false;
    const measure = () => {
      pending = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const nextPercent = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100;
      const bounded = Math.max(checkpointRef.current.readPercent, Math.min(100, Math.max(0, nextPercent)));
      setReadPercent(bounded);
      checkpointRef.current.readPercent = bounded;
      let visibleIndex = -1;
      sectionRefs.current.forEach((node, index) => {
        if (node && node.getBoundingClientRect().top <= 180) visibleIndex = index;
      });
      if (visibleIndex >= 0) checkpointRef.current.lastSectionIndex = visibleIndex;
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = window.setInterval(() => onCheckpoint?.(checkpointRef.current), 15000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(timer);
      onCheckpoint?.(checkpointRef.current);
    };
  }, [onCheckpoint]);

  if (!sections.length) return null;
  const showResume = (initialCheckpoint?.readPercent ?? 0) > 4 || (initialCheckpoint?.lastSectionIndex ?? 0) > 0;

  return (
    <div className="space-y-4">
      <section className="sticky top-[65px] z-20 -mx-4 border-y border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={readPercent} className="h-2 flex-1" />
            <span className="min-w-10 text-right text-xs tabular-nums text-muted-foreground">{readPercent}%</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={depth === "deep" ? "default" : "secondary"}>
              {depth === "deep" ? "Estudo Bíblico Aprofundado" : "Estudo Bíblico"}
            </Badge>
            <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ListTree className="size-4" /> Seções
                  <ChevronDown className={cn("size-3.5 transition-transform", tocOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute right-4 left-4 mt-2 max-h-[55vh] overflow-y-auto rounded-md border bg-popover p-2 shadow-soft sm:right-auto sm:left-auto sm:w-80">
                {sections.map((section, index) => (
                  <Button
                    key={section.id}
                    variant={activeSection === index ? "secondary" : "ghost"}
                    size="sm"
                    className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                    onClick={() => goToSection(index)}
                  >
                    <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}</span>
                    {section.title}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
            {showResume ? (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => goToSection(initialCheckpoint?.lastSectionIndex ?? 0)}>
                <RotateCcw className="size-4" /> Continuar de onde parei
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <Card className="space-y-4 border-primary/20 p-4 shadow-soft sm:p-5" aria-label="Áudio sincronizado do estudo">
        <div className="flex flex-wrap items-center gap-2">
          <Headphones className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-semibold">Ouvir e acompanhar</h2>
          <Badge variant="outline" className="ml-auto">
            {tts.state === "playing" ? "Reproduzindo" : tts.state === "paused" ? "Pausado" : "Pronto"}
          </Badge>
        </div>
        {tts.supported ? (
          <>
            <p className="text-xs text-muted-foreground">{tts.voiceName} · português prioritário</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={scope === "all" ? "secondary" : "outline"} size="sm" onClick={() => setScope("all")}>Estudo completo</Button>
              <Button variant={scope === "section" ? "secondary" : "outline"} size="sm" onClick={() => setScope("section")}>Seção atual</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => seekUnit(-1)} aria-label="Trecho anterior"><SkipBack className="size-4" /></Button>
              <Button
                size="icon"
                className="size-12 rounded-full"
                onClick={tts.state === "playing" ? tts.pause : tts.state === "paused" ? tts.resume : play}
                aria-label={tts.state === "playing" ? "Pausar" : tts.state === "paused" ? "Continuar" : "Ouvir"}
              >
                {tts.state === "playing" ? <Pause className="size-5" /> : <Play className="size-5" />}
              </Button>
              <Button size="icon" variant="outline" onClick={() => seekUnit(1)} aria-label="Próximo trecho"><SkipForward className="size-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => tts.stop()}><Square className="mr-1 size-4" /> Parar</Button>
              {tts.state === "playing" ? <span className="ml-auto flex items-center gap-1 text-xs font-medium text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" /> Lendo trecho {tts.unitIndex + 1}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted-foreground">Velocidade</span>
              {STUDY_PLAYBACK_RATES.map((value) => (
                <Button key={value} size="sm" variant={tts.rate === value ? "default" : "outline"} className="h-9 min-w-11 px-2 text-xs" onClick={() => tts.setRate(value)}>{value}x</Button>
              ))}
            </div>
            {tts.error ? <p role="alert" className="text-xs text-destructive">{tts.error}</p> : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">A voz deste navegador não está disponível. Você ainda pode acompanhar o estudo pela leitura.</p>
        )}
      </Card>

      <article className="mx-auto max-w-3xl divide-y divide-border/70 border-y border-border/70 bg-card sm:rounded-md sm:border">
        <header className="space-y-2 px-4 py-6 sm:px-7">
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" />{reference ?? "Estudo bíblico"}</div>
          <h1 className="font-display text-2xl leading-tight font-semibold sm:text-3xl">{title}</h1>
        </header>
        {sections.map((section, index) => {
          const active = index === activeSection && (tts.state === "playing" || tts.state === "paused");
          const content = (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-display text-xl leading-snug font-semibold">{section.title}</h2>
                {section.confidence ? <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", CONFIDENCE_CLASSES[section.confidence])}>{confidenceLabel(section.confidence)}</span> : null}
              </div>
              <div className={cn("whitespace-pre-line text-[16px] leading-8 text-foreground/90", section.kind === "scripture" && "verse-text border-l-2 border-gold pl-4 text-lg")}>{section.body}</div>
              {section.scriptureRefs?.length ? <div className="flex flex-wrap gap-2">{section.scriptureRefs.map((ref) => <Badge key={ref} variant="outline" className="text-primary">{ref}</Badge>)}</div> : null}
            </div>
          );
          return (
            <section
              key={section.id}
              ref={(node) => { sectionRefs.current[index] = node; }}
              className={cn("scroll-mt-40 px-4 py-6 transition-colors sm:px-7", active && "bg-primary/8 ring-2 ring-inset ring-primary/30")}
              aria-current={active ? "true" : undefined}
            >
              {section.collapsible ? (
                <Collapsible>
                  <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between gap-2 text-left font-display text-xl font-semibold">
                    {section.title}<ChevronRight className="size-5" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">{content}</CollapsibleContent>
                </Collapsible>
              ) : content}
            </section>
          );
        })}
      </article>
    </div>
  );
}