import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Heart, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchScriptures } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/pesquisa")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Pesquisa inteligente — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Pesquise por temas como ansiedade, fé, casamento ou salvação e receba versículos, aplicações e oração.",
      },
      { property: "og:title", content: "Pesquisa inteligente" },
      { property: "og:description", content: "Encontre na Bíblia respostas para o seu momento." },
    ],
  }),
  component: PesquisaPage,
});

const TEMAS = [
  "ansiedade",
  "medo",
  "casamento",
  "dinheiro",
  "fé",
  "oração",
  "salvação",
  "Espírito Santo",
  "perdão",
  "propósito",
];

function PesquisaPage() {
  const [query, setQuery] = useState("");
  const fn = useServerFn(searchScriptures);

  const search = useMutation({
    mutationFn: (value: string) => fn({ data: { query: value } }),
    onError: () => toast.error("Não foi possível pesquisar agora."),
  });

  function run(value: string) {
    const v = value.trim();
    if (v.length < 2) return;
    setQuery(v);
    search.mutate(v);
  }

  return (
    <AppShell
      title="Pesquisa bíblica"
      subtitle="Encontre orientação na Palavra para o seu momento."
    >
      <div className="mx-auto w-full max-w-5xl space-y-7 pb-8">
        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.08] via-background to-amber-500/[0.06] p-5 shadow-soft sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary" aria-hidden="true">
              <BookOpen className="size-6" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                O que você busca hoje?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Explore temas da Bíblia e receba versículos, aplicações e oração.
              </p>
            </div>
          </div>
          <form
            className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-background p-2 shadow-sm sm:flex-row sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              run(query);
            }}
          >
            <Search
              className="ml-2 hidden size-5 shrink-0 text-muted-foreground sm:block"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: O que a Bíblia ensina sobre perdão?"
              aria-label="Pesquise um tema, dúvida ou situação"
              className="h-12 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              variant="hero"
              className="h-12 gap-2 rounded-xl px-6"
              disabled={search.isPending}
            >
              <Search className="size-4" aria-hidden="true" />{" "}
              {search.isPending ? "Pesquisando…" : "Pesquisar"}
            </Button>
          </form>

          <div className="mt-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-amber-600" aria-hidden="true" /> Temas para explorar
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMAS.map((tema) => (
                <Button
                  key={tema}
                  variant="outline"
                  size="sm"
                  onClick={() => run(tema)}
                  disabled={search.isPending}
                  className="rounded-full border-border/70 bg-background/80 px-4 capitalize transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {tema}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {search.isPending ? (
          <div className="space-y-4" aria-label="Carregando resultados" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : search.data ? (
          <div className="flex flex-col gap-4">
            <Card className="rounded-2xl border-border/60 bg-card p-5 shadow-soft sm:p-7">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                <Sparkles className="size-4" aria-hidden="true" />O que a Bíblia diz
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground/90 sm:text-base">
                {search.data.overview}
              </p>
            </Card>

            <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-7">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                <BookOpen className="size-4" aria-hidden="true" /> Versículos
              </p>
              <div className="mt-3 flex flex-col gap-4">
                {search.data.verses.map((verse) => (
                  <div key={verse.reference} className="rounded-xl bg-muted/40 p-4 sm:p-5">
                    <p className="font-display text-base leading-relaxed text-foreground sm:text-lg">
                      “{verse.text}”
                    </p>
                    <p className="mt-2 text-sm font-semibold text-primary">{verse.reference}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {verse.note}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-7">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                <ArrowRight className="size-4" aria-hidden="true" />
                Aplicações práticas
              </p>
              <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed marker:text-amber-600">
                {search.data.practical.map((item) => (
                  <li key={item} className="pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="rounded-2xl border-amber-500/20 bg-amber-500/[0.04] p-5 shadow-soft sm:p-7">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                <Heart className="size-4 text-amber-600" aria-hidden="true" /> Oração
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground/90 sm:text-base">
                {search.data.prayer}
              </p>
            </Card>

            <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-7">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                <BookOpen className="size-4" aria-hidden="true" />
                Estudos sugeridos
              </p>
              <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed marker:text-amber-600">
                {search.data.studySuggestions.map((item) => (
                  <li key={item} className="pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
