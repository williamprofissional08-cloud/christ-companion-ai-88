import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDevotional } from "@/lib/ai.functions";
import { todayISO } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/devocional")({
  head: () => ({
    meta: [
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
  const fn = useServerFn(getDevotional);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["devotional", day],
    queryFn: () => fn({ data: { day } }),
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
          Não foi possível gerar o devocional agora. Recarregue a página em instantes.
        </p>
      </AppShell>
    );
  }

  const blocks = [
    { label: "Reflexão", text: data.reflection },
    { label: "Aplicação prática", text: data.application },
    { label: "Oração", text: data.prayer },
    { label: "Desafio de hoje", text: data.challenge },
    { label: "Pergunta para reflexão", text: data.question },
    { label: "Leitura sugerida", text: data.readingSuggestion },
  ];

  return (
    <AppShell title="Devocional de hoje" subtitle={data.theme}>
      <Card className="animate-rise border-border/50 p-6 shadow-soft">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">Versículo</p>
        <blockquote className="mt-3 font-display text-xl leading-relaxed">
          “{data.verse.text}”
        </blockquote>
        <p className="mt-2 text-sm font-medium text-muted-foreground">{data.verse.reference}</p>
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
    </AppShell>
  );
}
