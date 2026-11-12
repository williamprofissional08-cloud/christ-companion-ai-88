import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Check, ChevronRight, Flame, Lightbulb, MessageCircle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportCard } from "@/components/ExportCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDevotional } from "@/lib/ai.functions";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { fallbackDevotional, devotionalLibrarySize } from "@/lib/content/fallback-devotional";
import { useBrazilDay } from "@/hooks/use-brazil-day";

export const Route = createFileRoute("/_authenticated/devocional")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Devocional diário — Caminhando com Cristo" },
      {
        name: "description",
        content: "Versículo, reflexão, aplicação prática, oração e desafio para o seu dia.",
      },
      { property: "og:title", content: "Devocional diário" },
      { property: "og:description", content: "Seu momento diário com Deus e a Palavra." },
    ],
  }),
  component: DevocionalPage,
});

function DevocionalPage() {
  const day = useBrazilDay();
  const [draw, setDraw] = useState(0);

  useEffect(() => {
    setDraw(0);
  }, [day]);
  const fn = useServerFn(getDevotional);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["devotional", day],
    queryFn: () => loadDevotionalSafely(day, () => fn({ data: { day } })),
    retry: false,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <AppShell title="Devocional de hoje" subtitle="Preparando sua leitura...">
        <div className="mx-auto max-w-5xl space-y-4" aria-label="Carregando devocional">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-36 rounded-3xl" /><Skeleton className="h-36 rounded-3xl" /></div>
        </div>
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell title="Devocional de hoje">
        <div role="alert" className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {error instanceof Error && error.message
            ? error.message
            : "Não foi possível gerar o devocional agora. Recarregue a página em instantes."}
        </div>
      </AppShell>
    );
  }

  const displayedData = draw === 0 ? data : fallbackDevotional(day, draw);
  const isSynthesis = displayedData.verse.kind === "synthesis" || displayedData.verse.text.startsWith("Síntese para meditação, não uma citação literal:");
  const verseText = displayedData.verse.text.replace(/^Síntese para meditação, não uma citação literal:\s*/i, "");
  const dateLabel = new Date(`${day}T12:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const blocks = [
    { label: "Reflexão", text: displayedData.reflection, icon: BookOpen, accent: "blue" },
    { label: "Aplicação prática", text: displayedData.application, icon: Lightbulb, accent: "gold" },
    { label: "Oração", text: displayedData.prayer, icon: Sparkles, accent: "blue" },
    { label: "Desafio de hoje", text: displayedData.challenge, icon: Flame, accent: "gold" },
    { label: "Pergunta para reflexão", text: displayedData.question, icon: MessageCircle, accent: "blue" },
    { label: "Leitura sugerida", text: displayedData.readingSuggestion, icon: BookOpen, accent: "gold" },
  ];

  return (
    <AppShell title="Devocional de hoje" subtitle={displayedData.theme}>
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary"><span className="h-1 w-8 rounded-full bg-amber-400" />Seu momento com a Palavra</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#142d59] dark:text-foreground sm:text-4xl">Devocional</h1>
            <p className="mt-1 flex items-center gap-2 text-sm capitalize text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{dateLabel}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary dark:bg-primary/15"><BookOpen className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="text-sm font-semibold">Biblioteca bíblica</p><p className="text-xs text-muted-foreground">{devotionalLibrarySize().toLocaleString("pt-BR")} combinações</p></div>
            <button type="button" onClick={() => setDraw(Math.floor(Math.random() * devotionalLibrarySize()) + 1)} className="ml-1 inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4 sm:text-sm">
              <span className="hidden sm:inline">Sortear outro</span><span className="sm:hidden">Outro</span><ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        <ExportCard filename={`devocional-${day}-${draw}`} title={`Devocional — ${displayedData.theme}`}>
          <section aria-labelledby="verse-heading" className="relative isolate overflow-hidden rounded-3xl border border-blue-900/10 bg-gradient-to-br from-[#f5f9ff] via-white to-[#e7f1ff] p-6 shadow-sm dark:border-white/10 dark:from-[#162743] dark:via-[#13223a] dark:to-[#1a3150] sm:p-9 lg:p-11">
            <img src="/images/devotional-reflection.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25 dark:opacity-15" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-white/90 via-white/80 to-white/55 dark:from-[#162743]/95 dark:via-[#13223a]/90 dark:to-[#1a3150]/75" />
            <div className="absolute -right-12 -top-16 -z-10 size-64 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-300/10" />
            <div className="max-w-3xl">
              <p id="verse-heading" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary dark:text-blue-300"><span className="h-1 w-8 rounded-full bg-amber-400" />{isSynthesis ? "Síntese para meditação" : "Palavra do dia"}</p>
              <p className="mt-6 font-display text-2xl font-semibold leading-snug tracking-tight text-[#142d59] dark:text-white sm:text-3xl lg:text-4xl">“{verseText}”</p>
              <p className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300"><span className="h-1 w-6 rounded-full bg-amber-400" />{displayedData.verse.reference}</p>
            </div>
            <div className="mt-8 flex items-center gap-2 border-t border-blue-900/10 pt-4 text-sm italic text-slate-600 dark:border-white/10 dark:text-slate-300"><Sparkles className="size-4 shrink-0 text-amber-500" aria-hidden="true" />{displayedData.theme}</div>
          </section>

          <section aria-label="Leitura e reflexão" className="mt-5 grid gap-4 sm:mt-6 md:grid-cols-2">
            {blocks.map((block, index) => {
              const Icon = block.icon;
              const gold = block.accent === "gold";
              return (
                <Card key={block.label} className={`animate-rise rounded-3xl border-border/70 p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 ${index === 0 ? "md:col-span-2" : ""}`}>
                  <div className="flex items-start gap-4">
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${gold ? "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" : "bg-blue-50 text-primary dark:bg-primary/15 dark:text-blue-300"}`}><Icon className="size-5" aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-semibold text-[#142d59] dark:text-foreground">{block.label}</h2>
                        {index === 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:text-blue-300">Hoje</span> : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-[15px]">{block.text}</p>
                    </div>
                    {index === 0 ? <ChevronRight className="mt-2 size-5 shrink-0 text-primary" aria-hidden="true" /> : null}
                  </div>
                </Card>
              );
            })}
          </section>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />Reserve alguns minutos para caminhar com esta mensagem.</p>
        </ExportCard>
      </div>
    </AppShell>
  );
}
