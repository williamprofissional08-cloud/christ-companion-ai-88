import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Route as RouteIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { buildSteps, READING_TRACKS, TRACK_THEMES } from "@/lib/content/tracks";
import { listTrackProgress } from "@/lib/tracks.functions";

export const Route = createFileRoute("/_authenticated/trilhas/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Trilhas guiadas de leitura — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Trilhas por tema com etapas de leitura, checkpoints e revisão para crescer na Palavra.",
      },
      { property: "og:title", content: "Trilhas guiadas de leitura" },
      {
        property: "og:description",
        content: "Ansiedade, fé, oração e mais: percursos bíblicos passo a passo.",
      },
    ],
  }),
  component: TrilhasPage,
});

function TrilhasPage() {
  const [theme, setTheme] = useState<string>("Todos");
  const [query, setQuery] = useState("");
  const fetchProgress = useServerFn(listTrackProgress);
  const { data: progress } = useQuery({
    queryKey: ["track-progress-all"],
    queryFn: () => fetchProgress(),
  });

  const progressMap = new Map(
    (progress ?? []).map((row) => [row.track_slug, row.completed_steps?.length ?? 0]),
  );

  const tracks = READING_TRACKS.filter((track) => {
    const matchesTheme = theme === "Todos" || track.theme === theme;
    const text = `${track.title} ${track.summary} ${track.theme}`.toLowerCase();
    return matchesTheme && text.includes(query.trim().toLowerCase());
  });

  return (
    <AppShell
      title="Trilhas guiadas"
      subtitle="Leituras por tema com checkpoints e revisão final"
    >
      <div className="space-y-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar trilha (ex.: ansiedade, fé, oração)"
        />
        <div className="flex flex-wrap gap-2">
          {["Todos", ...TRACK_THEMES].map((item) => (
            <button key={item} type="button" onClick={() => setTheme(item)}>
              <Badge
                variant={theme === item ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {item}
              </Badge>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tracks.map((track) => {
            const total = buildSteps(track).length;
            const done = progressMap.get(track.slug) ?? 0;
            return (
              <Link key={track.slug} to="/trilhas/$slug" params={{ slug: track.slug }}>
                <Card className="animate-rise h-full border-border/50 p-5 shadow-soft transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
                    <RouteIcon className="size-4" /> {track.theme}
                  </div>
                  <h2 className="mt-2 font-display text-lg font-semibold">{track.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{track.summary}</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">{track.keyVerse}</p>
                  <div className="mt-4">
                    <Progress value={(done / total) * 100} />
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      {done} de {total} etapas <ArrowRight className="size-3" />
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma trilha encontrada para essa busca.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
