import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Moon, Search, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { explainReference, readPassage } from "@/lib/ai.functions";
import { addFavorite } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/biblia")({
  head: () => ({
    meta: [
      { title: "Bíblia — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Leia a Bíblia (Almeida), pesquise passagens, favorite versículos e receba explicações fundamentadas.",
      },
      { property: "og:title", content: "Bíblia integrada" },
      { property: "og:description", content: "Leia, favorite e entenda a Palavra de Deus." },
    ],
  }),
  component: BibliaPage,
});

const SUGGESTIONS = ["João 3:16", "Salmos 23", "Romanos 8", "Filipenses 4:6-7", "Mateus 5"];

function BibliaPage() {
  const [reference, setReference] = useState("Salmos 23");
  const [night, setNight] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);

  const read = useServerFn(readPassage);
  const explain = useServerFn(explainReference);
  const favoriteFn = useServerFn(addFavorite);

  const passage = useMutation({
    mutationFn: (ref: string) => read({ data: { reference: ref } }),
    onSuccess: (data) => {
      setExplanation(null);
      setHistory((prev) => [data.reference, ...prev.filter((r) => r !== data.reference)].slice(0, 8));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Passagem inválida."),
  });

  const explainMutation = useMutation({
    mutationFn: () =>
      explain({
        data: {
          reference: passage.data?.reference ?? reference,
          text: passage.data?.text?.slice(0, 5000) ?? "",
        },
      }),
    onSuccess: (data) => setExplanation(data.markdown),
    onError: () => toast.error("Não foi possível explicar agora."),
  });

  const favorite = useMutation({
    mutationFn: () =>
      favoriteFn({
        data: {
          kind: "versiculo",
          reference: passage.data?.reference ?? reference,
          content: passage.data?.text?.slice(0, 3000),
        },
      }),
    onSuccess: () => toast.success("Salvo nos favoritos."),
    onError: () => toast.error("Não foi possível favoritar."),
  });

  return (
    <AppShell title="Bíblia" subtitle="Almeida · pesquise por livro, capítulo e versículo.">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (reference.trim().length > 1) passage.mutate(reference.trim());
        }}
      >
        <Input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Ex.: João 3:16, Salmos 23, Romanos 8:28"
          className="max-w-sm"
        />
        <Button type="submit" variant="hero" className="gap-2" disabled={passage.isPending}>
          <Search className="size-4" /> Ler
        </Button>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setNight(!night)}>
          <Moon className="size-4" /> {night ? "Leitura normal" : "Leitura noturna"}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            onClick={() => {
              setReference(s);
              passage.mutate(s);
            }}
          >
            {s}
          </Button>
        ))}
      </div>

      {passage.data ? (
        <Card
          className={
            night
              ? "mt-6 border-border/50 bg-slate-950 p-6 text-amber-50 shadow-soft"
              : "mt-6 border-border/50 p-6 shadow-soft"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{passage.data.reference}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => favorite.mutate()}
              >
                <Star className="size-4" /> Favoritar
              </Button>
              <Button
                variant="gold"
                size="sm"
                className="gap-2"
                onClick={() => explainMutation.mutate()}
                disabled={explainMutation.isPending}
              >
                <Sparkles className="size-4" />
                {explainMutation.isPending ? "Explicando..." : "Explicar"}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 font-display text-lg leading-relaxed">
            {passage.data.verses.length ? (
              passage.data.verses.map((verse) => (
                <p key={`${verse.chapter}:${verse.verse}`}>
                  <sup className="mr-1 text-xs opacity-70">{verse.verse}</sup>
                  {verse.text}
                </p>
              ))
            ) : (
              <p>{passage.data.text}</p>
            )}
          </div>
        </Card>
      ) : null}

      {explanation ? (
        <Card className="mt-4 border-border/50 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Explicação</p>
          <MarkdownContent className="mt-3">{explanation}</MarkdownContent>
        </Card>
      ) : null}

      {history.length ? (
        <Card className="mt-4 border-border/50 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Histórico</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {history.map((item) => (
              <Button
                key={item}
                variant="outline"
                size="sm"
                onClick={() => {
                  setReference(item);
                  passage.mutate(item);
                }}
              >
                {item}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}
    </AppShell>
  );
}
