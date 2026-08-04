import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
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
    <AppShell title="Pesquisa inteligente" subtitle="Versículos, aplicações e oração por tema.">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(query);
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquise um tema, dúvida ou situação"
          className="max-w-sm"
        />
        <Button type="submit" variant="hero" className="gap-2" disabled={search.isPending}>
          <Search className="size-4" /> Pesquisar
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {TEMAS.map((tema) => (
          <Button key={tema} variant="outline" size="sm" onClick={() => run(tema)}>
            {tema}
          </Button>
        ))}
      </div>

      {search.isPending ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : search.data ? (
        <div className="mt-6 flex flex-col gap-4">
          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              O que a Bíblia diz
            </p>
            <p className="mt-2 text-sm leading-relaxed">{search.data.overview}</p>
          </Card>

          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Versículos</p>
            <div className="mt-3 flex flex-col gap-4">
              {search.data.verses.map((verse) => (
                <div key={verse.reference}>
                  <p className="font-display text-base leading-relaxed">“{verse.text}”</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {verse.reference}
                  </p>
                  <p className="mt-1 text-sm">{verse.note}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Aplicações práticas
            </p>
            <ul className="mt-3 list-inside list-disc text-sm leading-relaxed">
              {search.data.practical.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Oração</p>
            <p className="mt-2 text-sm leading-relaxed">{search.data.prayer}</p>
          </Card>

          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Estudos sugeridos
            </p>
            <ul className="mt-3 list-inside list-disc text-sm leading-relaxed">
              {search.data.studySuggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
