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

  const featuredStudy = studies[0];

  return (
    <AppShell title="Estudos bíblicos" subtitle="Aprofunde seu conhecimento da Palavra de Deus.">
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-8">
        <section aria-label="Buscar e filtrar estudos" className="space-y-4">
          <label className="sr-only" htmlFor="study-search">Buscar livro ou tema</label>
          <Input
            id="study-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="⌕  Buscar livro ou tema (Davi, parábola...)"
            className="h-12 max-w-2xl rounded-2xl border-border/60 bg-muted/50 px-4 text-base shadow-sm placeholder:text-muted-foreground/80"
          />
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Categorias de estudos">
            <Button variant={category ? "outline" : "gold"} size="sm" className="shrink-0 rounded-full px-4" onClick={() => setCategory(null)}>
              Todos os temas
            </Button>
            {STUDY_CATEGORIES.map((itemCategory) => (
              <Button
                key={itemCategory}
                variant={category === itemCategory ? "gold" : "outline"}
                size="sm"
                className="shrink-0 rounded-full px-4"
                onClick={() => setCategory(itemCategory)}
              >
                {itemCategory}
              </Button>
            ))}
          </div>
        </section>

        {featuredStudy ? (
          <Card className="overflow-hidden rounded-3xl border-primary/10 bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 shadow-soft sm:p-7">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_1.35fr] sm:items-center">
              <div aria-hidden="true" className="relative min-h-36 overflow-hidden rounded-2xl bg-primary/10 sm:min-h-52">
                <img src="/images/study-bible.webp" alt="" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-amber-100/15" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-amber-600 uppercase dark:text-amber-400">Estudo em destaque · {featuredStudy.category}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{featuredStudy.title}</h2>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{featuredStudy.reference}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{featuredStudy.summary}</p>
                <Button asChild variant="hero" className="mt-5 w-full rounded-full sm:w-auto sm:px-8">
                  <Link to="/estudos/$slug" params={{ slug: featuredStudy.slug }}>Abrir estudo <span aria-hidden="true" className="ml-2">→</span></Link>
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <section className="space-y-4" aria-labelledby="journey-heading">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-amber-600 uppercase dark:text-amber-400">Explore as Escrituras</p>
              <h2 id="journey-heading" className="mt-1 font-display text-2xl font-semibold">Jornada bíblica</h2>
            </div>
            <span className="text-sm text-muted-foreground">{BIBLE_BOOKS.length} livros · {BIBLE_CHAPTER_TOTAL.toLocaleString("pt-BR")} capítulos</span>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Escolha um livro e abra o capítulo que deseja estudar. Cada capítulo apresenta o texto, o contexto, a interpretação e a aplicação.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <details key={book.slug} className="group rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors open:border-primary/30 open:bg-primary/[0.025]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span>
                    <span className="block font-semibold text-foreground">{book.name}</span>
                    <span className="text-xs text-muted-foreground">{book.testament} · {book.category}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {book.chapters} caps. <span aria-hidden="true" className="text-base transition-transform group-open:rotate-180">⌄</span>
                  </span>
                </summary>
                <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => (
                    <Button key={chapter} asChild size="sm" variant="outline" className="h-9 rounded-lg px-2">
                      <Link to="/estudos/$slug" params={{ slug: getChapterStudySlug(book.slug, chapter) }}>{chapter}</Link>
                    </Button>
                  ))}
                </div>
              </details>
            ))}
            {books.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum livro corresponde à busca.</p> : null}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="all-studies-heading">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-amber-600 uppercase dark:text-amber-400">Continue aprendendo</p>
              <h2 id="all-studies-heading" className="mt-1 font-display text-2xl font-semibold">Todos os estudos</h2>
            </div>
            <span className="pb-1 text-sm text-muted-foreground">{studies.length} {studies.length === 1 ? "estudo" : "estudos"}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {studies.map((study) => (
              <Card key={study.slug} className="group animate-rise flex flex-col rounded-2xl border-border/50 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">{study.category}</p>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{study.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{study.reference}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{study.summary}</p>
                <Button asChild variant="hero" size="sm" className="mt-5 w-full rounded-xl">
                  <Link to="/estudos/$slug" params={{ slug: study.slug }}>Estudar <span aria-hidden="true" className="ml-1">→</span></Link>
                </Button>
              </Card>
            ))}
            {studies.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum estudo encontrado.</p> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
