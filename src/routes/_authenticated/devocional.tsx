import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ExportCard } from "@/components/ExportCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDevotional } from "@/lib/ai.functions";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { fallbackDevotional, devotionalLibrarySize } from "@/lib/content/fallback-devotional";
import { todayISO } from "@/lib/types";

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
  const day = todayISO();
  const [draw, setDraw] = useState(0);
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
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell title="Devocional de hoje">
        <p className="text-sm text-muted-foreground">
          {error instanceof Error && error.message
            ? error.message
            : "Não foi possível gerar o devocional agora. Recarregue a página em instantes."}
        </p>
      </AppShell>
    );
  }


  const displayedData = draw === 0 ? data : fallbackDevotional(day, draw);
  const isSynthesis = displayedData.verse.kind === "synthesis" || displayedData.verse.text.startsWith("Síntese para meditação, não uma citação literal:");
  const verseText = displayedData.verse.text.replace(/^Síntese para meditação, não uma citação literal:\s*/i, "");
  const blocks = [
    { label: "Reflexão", text: displayedData.reflection },
    { label: "Aplicação prática", text: displayedData.application },
    { label: "Oração", text: displayedData.prayer },
    { label: "Desafio de hoje", text: displayedData.challenge },
    { label: "Pergunta para reflexão", text: displayedData.question },
    { label: "Leitura sugerida", text: displayedData.readingSuggestion },
  ];

  return (
    <AppShell title="Devocional de hoje" subtitle={displayedData.theme}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 p-4">
        <div><p className="text-sm font-medium">Biblioteca bíblica</p><p className="text-xs text-muted-foreground">{devotionalLibrarySize().toLocaleString("pt-BR")} combinações de leitura e reflexão</p></div>
        <button type="button" onClick={() => setDraw((current) => current + 1)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Sortear outro devocional</button>
      </div>
      <ExportCard filename={`devocional-${day}-${draw}`} title={`Devocional — ${displayedData.theme}`}>
      <Card className="animate-rise border-border/50 p-6 shadow-soft">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">{isSynthesis ? "Síntese para meditação" : "Versículo"}</p>
        {isSynthesis ? (
          <p className="mt-3 text-base leading-relaxed">{verseText}</p>
        ) : (
          <blockquote className="mt-3 font-display text-xl leading-relaxed">“{displayedData.verse.text}”</blockquote>
        )}
        <p className="mt-2 text-sm font-medium text-muted-foreground">{isSynthesis ? "Leitura bíblica sugerida: " : ""}{displayedData.verse.reference}</p>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {blocks.map((block) => (
          <Card key={block.label} className="animate-rise border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {block.label}
            </p>
            <p className="mt-3 text-sm leading-relaxed">{block.text}</p>
          </Card>
        ))}
      </div>
      </ExportCard>
    </AppShell>
  );
}
