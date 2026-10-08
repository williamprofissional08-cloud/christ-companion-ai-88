import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { STUDIES, STUDY_CATEGORIES } from "@/lib/content/studies";

export const Route = createFileRoute("/_authenticated/estudos/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Estudos bíblicos — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Biblioteca de estudos por livros, personagens, milagres, parábolas, profecias e doutrinas.",
      },
      { property: "og:title", content: "Estudos bíblicos" },
      { property: "og:description", content: "Aprofunde-se na Palavra com estudos completos." },
    ],
  }),
  component: EstudosPage,
});

function EstudosPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const studies = STUDIES.filter((study) => {
    const matchesCategory = !category || study.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      study.title.toLowerCase().includes(q) ||
      study.summary.toLowerCase().includes(q) ||
      study.reference.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <AppShell title="Estudos bíblicos" subtitle="Contexto, aplicação e referências.">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar estudo (Davi, parábola, Apocalipse...)"
        className="max-w-md"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant={category ? "outline" : "gold"} size="sm" onClick={() => setCategory(null)}>
          Todos
        </Button>
        {STUDY_CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={category === c ? "gold" : "outline"}
            size="sm"
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {studies.map((study) => (
          <Card key={study.slug} className="animate-rise border-border/50 p-5 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {study.category}
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold">{study.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{study.reference}</p>
            <p className="mt-2 text-sm text-muted-foreground">{study.summary}</p>
            <Button asChild variant="hero" size="sm" className="mt-4">
              <Link to="/estudos/$slug" params={{ slug: study.slug }}>
                Estudar
              </Link>
            </Button>
          </Card>
        ))}
        {studies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum estudo encontrado.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
