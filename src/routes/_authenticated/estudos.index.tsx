import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublishedManagedCatalog } from "@/lib/admin.functions";
import { BIBLE_BOOKS, BIBLE_CHAPTER_TOTAL, getChapterStudySlug } from "@/lib/content/bible-books";
import { deduplicateStudies, STUDIES, STUDY_CATEGORIES } from "@/lib/content/studies";
import { CURATED_STUDIES } from "@/lib/content/curated-studies";

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
  const catalogFn = useServerFn(getPublishedManagedCatalog);
  const { data: managedStudies = [] } = useQuery({
    queryKey: ["published-managed-catalog", "study"],
    queryFn: () => catalogFn({ data: { kind: "study" } }),
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  const catalog = new Map(STUDIES.map((item) => [item.slug, item]));
  for (const item of managedStudies) {
    if (item.status === "archived") {
      catalog.delete(item.slug);
      continue;
    }

    const previous = catalog.get(item.slug);
    const metadata = item.metadata as Record<string, unknown>;
    catalog.set(item.slug, {
      slug: item.slug,
      title: String(metadata["title"] ?? previous?.title ?? item.slug),
      category: String(metadata["category"] ?? previous?.category ?? "Estudos bíblicos"),
      reference: String(metadata["reference"] ?? previous?.reference ?? ""),
      summary: String(metadata["summary"] ?? previous?.summary ?? ""),
      depth: metadata["depth"] === "deep" ? "deep" : previous?.depth ?? "simple",
    });
  }

  const studies = deduplicateStudies([...catalog.values()]).filter((study) => {
    const matchesCategory = !category || study.category === category;
    const matchesQuery =
      !normalizedQuery ||
      study.title.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      study.summary.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      study.reference.toLocaleLowerCase("pt-BR").includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  const books = BIBLE_BOOKS.filter(
    (book) =>
      !normalizedQuery ||
      book.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      book.testament.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      book.category.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
  );

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
        {STUDY_CATEGORIES.map((itemCategory) => (
          <Button
            key={itemCategory}
            variant={category === itemCategory ? "gold" : "outline"}
            size="sm"
            onClick={() => setCategory(itemCategory)}
          >
            {itemCategory}
          </Button>
        ))}
      </div>

      <section className="mt-8 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Jornada Bíblica — 66 livros, capítulo por capítulo
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {BIBLE_BOOKS.length} livros · {BIBLE_CHAPTER_TOTAL.toLocaleString("pt-BR")} capítulos.
            Escolha um livro e abra o capítulo que deseja estudar. Cada capítulo possui seu próprio
            estudo bíblico, organizado para apresentar o texto, o contexto, a interpretação e a aplicação.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <details key={book.slug} className="rounded-xl border border-border/60 bg-card p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span>
                  <span className="block font-semibold">{book.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {book.testament} · {book.category}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {book.chapters} caps.
                </span>
              </summary>
              <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => (
                  <Button key={chapter} asChild size="sm" variant="outline" className="h-9 px-2">
                    <Link
                      to="/estudos/$slug"
                      params={{ slug: getChapterStudySlug(book.slug, chapter) }}
                    >
                      {chapter}
                    </Link>
                  </Button>
                ))}
              </div>
            </details>
          ))}
          {books.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum livro corresponde à busca.
            </p>
          ) : null}
        </div>
      </section>

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
