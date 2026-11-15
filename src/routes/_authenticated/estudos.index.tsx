import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, Bookmark, ChevronDown, Clock3, Filter,
  GraduationCap, Heart, LibraryBig, Play, Search, UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublishedManagedCatalog } from "@/lib/admin.functions";
import { BIBLE_BOOKS, BIBLE_CHAPTER_TOTAL, getChapterStudySlug } from "@/lib/content/bible-books";
import { getBibleBookCover } from "@/lib/content/bible-book-covers";
import { getBibleBookPhoto } from "@/lib/content/bible-book-photographs";
import { deduplicateStudies, getStudy, STUDIES, STUDY_CATEGORIES } from "@/lib/content/studies";
import { CURATED_STUDIES } from "@/lib/content/curated-studies";
import { resolveManagedStudy } from "@/lib/content/managed-study-catalog";
import { getRecentStudyCheckpoint } from "@/lib/study-progress.functions";

export const Route = createFileRoute("/_authenticated/estudos/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Estudos bíblicos — Caminho Divino" },
      {
        name: "description",
        content: "Biblioteca de estudos e leitura por todos os 66 livros da Bíblia, com capítulos, personagens e temas.",
      },
      { property: "og:title", content: "Estudos bíblicos" },
      { property: "og:description", content: "Aprofunde-se na Palavra com estudos completos." },
    ],
  }),
  component: EstudosPage,
});

type TestamentFilter = "todos" | "antigo" | "novo";

function EstudosPage() {
  const catalogFn = useServerFn(getPublishedManagedCatalog);
  const latestCheckpointFn = useServerFn(getRecentStudyCheckpoint);
  const { data: managedStudies = [], isError: catalogError, refetch: retryCatalog } = useQuery({
    queryKey: ["published-managed-catalog", "study"],
    queryFn: () => catalogFn({ data: { kind: "study" } }),
  });
  const { data: lastCheckpoint } = useQuery({
    queryKey: ["study-recent-checkpoint"],
    queryFn: () => latestCheckpointFn(),
    retry: false,
  });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [testament, setTestament] = useState<TestamentFilter>("todos");
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllStudies, setShowAllStudies] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  const catalog = new Map(STUDIES.map((item) => [item.slug, item]));
  for (const item of managedStudies) {
    const resolved = resolveManagedStudy(catalog.get(item.slug), item, Boolean(CURATED_STUDIES[item.slug]));
    if (resolved) catalog.set(item.slug, resolved);
    else catalog.delete(item.slug);
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

  const books = BIBLE_BOOKS.filter((book) => {
    const matchesTestament =
      testament === "todos" ||
      (testament === "antigo" && book.testament === "Antigo Testamento") ||
      (testament === "novo" && book.testament === "Novo Testamento");
    const matchesQuery =
      !normalizedQuery ||
      book.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      book.testament.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      book.category.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesTestament && matchesQuery;
  });

  const recentStudy = lastCheckpoint ? getStudy(lastCheckpoint.slug) : undefined;
  const hasRecentStudy = Boolean(lastCheckpoint && recentStudy);
  const resumeSlug = hasRecentStudy && lastCheckpoint ? lastCheckpoint.slug : "genesis-1-criacao";
  const resumeTitle = recentStudy?.title ?? "Gênesis 1: No princípio, Deus";
  const resumeReference = recentStudy?.reference ?? "Gênesis 1:1–31";
  const resumeBook = BIBLE_BOOKS.find((book) => resumeTitle.startsWith(book.name)) ?? BIBLE_BOOKS[0]!;
  const visibleStudies = showAllStudies ? studies : studies.slice(0, 6);

  function openFocus(focus: "biblia" | "teologia" | "lideranca") {
    setTestament("todos");
    setShowFilters(false);
    setShowAllStudies(false);
    if (focus === "teologia") {
      setQuery("");
      setCategory("Doutrinas");
    } else if (focus === "lideranca") {
      setQuery("liderança");
      setCategory(null);
    } else {
      setQuery("");
      setCategory(null);
    }
  }

  return (
    <AppShell title="Estudos bíblicos" subtitle="Aprofunde seu conhecimento da Palavra de Deus.">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 text-[#102b4e] dark:text-foreground sm:space-y-8">
        {catalogError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <span>Não foi possível carregar os estudos administrados. Os estudos locais continuam disponíveis.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void retryCatalog()}>Tentar novamente</Button>
          </div>
        ) : null}

        <section aria-labelledby="studies-title" className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#082f4e] text-white shadow-lg">
          <img src="/images/study-bible.webp" alt="" className="absolute inset-0 -z-20 size-full object-cover object-center" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#082a48]/95 via-[#0e3652]/85 to-[#0e3652]/30" />
          <div className="max-w-xl px-5 py-9 sm:px-9 sm:py-12">
            <span className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f5d79e]">
              <BookOpen className="size-5" aria-hidden="true" /> Biblioteca bíblica
            </span>
            <h1 id="studies-title" className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Estudos</h1>
            <p className="mt-2 max-w-sm text-base leading-relaxed text-blue-50 sm:text-lg">
              Aprofunde seu conhecimento na Palavra de Deus.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <BookOpen className="size-4" aria-hidden="true" /> 66 livros · {BIBLE_CHAPTER_TOTAL.toLocaleString("pt-BR")} capítulos
            </div>
          </div>
        </section>

        <section aria-label="Busca e acessos de estudos" className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
            <label className="sr-only" htmlFor="study-search">Buscar livro, capítulo, tema ou personagem</label>
            <Input
              id="study-search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setShowAllStudies(false); }}
              placeholder="Buscar estudo, livro, tema ou personagem..."
              className="h-13 rounded-2xl border-blue-100 bg-white pl-12 pr-4 text-sm shadow-sm placeholder:text-slate-500 dark:border-border dark:bg-card sm:text-base"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Atalhos de estudos">
            <button type="button" onClick={() => openFocus("biblia")}
              className={"inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors " +
                (!category && !query ? "border-[#d4a957] bg-[#123f60] text-white" : "border-border bg-card text-foreground hover:bg-primary/10")}>
              <BookOpen className="size-4" aria-hidden="true" /> Bíblia
            </button>
            <button type="button" onClick={() => openFocus("teologia")}
              className={"inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors " +
                (category === "Doutrinas" ? "border-[#d4a957] bg-[#123f60] text-white" : "border-border bg-card text-foreground hover:bg-primary/10")}>
              <GraduationCap className="size-4" aria-hidden="true" /> Teologia
            </button>
            <Link to="/devocional" search={{}} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-primary/10">
              <Heart className="size-4" aria-hidden="true" /> Devocional
            </Link>
            <button type="button" onClick={() => openFocus("lideranca")}
              className={"inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors " +
                (query === "liderança" ? "border-[#d4a957] bg-[#123f60] text-white" : "border-border bg-card text-foreground hover:bg-primary/10")}>
              <UsersRound className="size-4" aria-hidden="true" /> Liderança
            </button>
            <Link to="/escola" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-primary/10">
              <GraduationCap className="size-4" aria-hidden="true" /> Escola Bíblica
            </Link>
          </div>
        </section>

        <section aria-labelledby="continue-study-title" className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm dark:border-border dark:bg-card sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="continue-study-title" className="flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
              <Play className="size-5 text-primary" aria-hidden="true" /> {hasRecentStudy ? "Continue estudando" : "Comece sua jornada"}
            </h2>
            <Link to="/metas" className="shrink-0 text-xs font-semibold text-primary hover:underline sm:text-sm">Minha jornada <ArrowRight className="inline size-4" aria-hidden="true" /></Link>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-[#f5f9fd] p-3 dark:border-border dark:bg-background/40 sm:flex-row sm:items-center">
            <img src={getBibleBookCover(resumeBook)} alt={"Ilustração temática de " + resumeBook.name} className="h-28 w-full shrink-0 rounded-xl object-cover sm:h-28 sm:w-40" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{hasRecentStudy ? "Sua última leitura" : "Sugestão para começar"}</p>
              <h3 className="mt-1 font-display text-lg font-semibold leading-tight sm:text-xl">{resumeTitle}</h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{resumeReference}</p>
              {hasRecentStudy && lastCheckpoint ? (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700" aria-label={"Leitura " + lastCheckpoint.readPercent + "% concluída"}>
                    <div className="h-full rounded-full bg-[#185783]" style={{ width: lastCheckpoint.readPercent + "%" }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{lastCheckpoint.readPercent}%</span>
                </div>
              ) : null}
            </div>
            <Button asChild className="w-full shrink-0 rounded-full bg-[#103e60] text-white hover:bg-[#15577e] sm:w-auto">
              <Link to="/estudos/$slug" params={{ slug: resumeSlug }}><Play className="mr-2 size-4" aria-hidden="true" /> {hasRecentStudy ? "Continuar" : "Estudar"}</Link>
            </Button>
          </div>
        </section>

        <section id="study-library" className="space-y-4" aria-labelledby="study-library-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#b47d2e] dark:text-amber-400">Explore as Escrituras</span>
              <h2 id="study-library-heading" className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
                <LibraryBig className="size-6 text-primary" aria-hidden="true" /> Biblioteca de estudos
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Selecione um livro para abrir seus capítulos.</p>
            </div>
            <button type="button" onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters} aria-controls="bible-library-filters"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-blue-100 bg-white px-4 text-sm font-semibold text-primary shadow-sm hover:bg-blue-50 dark:border-border dark:bg-card">
              <Filter className="size-4" aria-hidden="true" /> Filtrar
            </button>
          </div>

          <div id="bible-library-filters" className={showFilters ? "space-y-3" : "space-y-3"}>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por testamento">
              {([
                ["todos", "Todos os livros"],
                ["antigo", "Antigo Testamento"],
                ["novo", "Novo Testamento"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setTestament(value); setExpandedBook(null); }}
                  aria-pressed={testament === value}
                  className={"min-h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors sm:text-sm " +
                    (testament === value ? "bg-[#103e60] text-white" : "border border-border bg-card text-muted-foreground hover:text-foreground")}>
                  {label}
                </button>
              ))}
            </div>
            {showFilters ? (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card p-3" aria-label="Categorias de estudos">
                <button type="button" onClick={() => setCategory(null)} className={"rounded-full px-3 py-1.5 text-xs " + (!category ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>Todas as categorias</button>
                {STUDY_CATEGORIES.map((option) => (
                  <button key={option} type="button" onClick={() => { setCategory(option); setShowAllStudies(false); }}
                    className={"rounded-full px-3 py-1.5 text-xs " + (category === option ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{option}</button>
                ))}
              </div>
            ) : null}
          </div>

          <p role="status" className="text-xs text-muted-foreground">
            {books.length} {books.length === 1 ? "livro" : "livros"} na biblioteca · {BIBLE_BOOKS.length} no total
          </p>
          <div className="grid items-start gap-3 md:grid-cols-2">
            {books.map((book) => {
              const isOpen = expandedBook === book.slug;
              return (
                <article key={book.slug} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition-colors hover:border-blue-200 dark:border-border dark:bg-card">
                  <button type="button" onClick={() => setExpandedBook(isOpen ? null : book.slug)}
                    aria-expanded={isOpen} aria-controls={"book-chapters-" + book.slug}
                    className="flex w-full items-center gap-3 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3.5">
                    <span className="relative block h-22 w-28 shrink-0 overflow-hidden rounded-xl bg-[#173e60] shadow-sm sm:h-25 sm:w-36">
                      <img
                        src={getBibleBookPhoto(book)}
                        alt={"Imagem temática do livro de " + book.name}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          // A capa SVG exclusiva garante que nenhum livro fique sem imagem.
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = getBibleBookCover(book);
                        }}
                        className="absolute inset-0 size-full object-cover"
                      />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#092a49]/85 via-[#092a49]/10 to-transparent" />
                      <span aria-hidden="true" className="absolute bottom-2 left-2 right-2 truncate font-display text-xs font-bold text-white drop-shadow sm:text-sm">{book.name}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg font-bold leading-snug text-foreground">{book.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{book.testament} · {book.category}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"><BookOpen className="size-3.5" aria-hidden="true" /> {book.chapters} capítulos</span>
                    </span>
                    <ChevronDown className={"size-5 shrink-0 text-primary transition-transform " + (isOpen ? "rotate-180" : "")} aria-hidden="true" />
                  </button>
                  {isOpen ? (
                    <div id={"book-chapters-" + book.slug} className="border-t border-blue-100 bg-[#f5f9fe] p-3 dark:border-border dark:bg-background/40">
                      <p className="mb-3 text-xs font-semibold text-muted-foreground">Escolha um capítulo de {book.name}</p>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                        {Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => (
                          <Button key={chapter} asChild variant="outline" size="sm" className="h-10 rounded-lg border-blue-200 bg-white px-1 text-primary dark:border-border dark:bg-card">
                            <Link to="/estudos/$slug" params={{ slug: getChapterStudySlug(book.slug, chapter) }}
                              aria-label={"Estudar " + book.name + " capítulo " + chapter}>{chapter}</Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          {books.length === 0 ? <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhum livro corresponde a esta busca. Veja os estudos por tema abaixo ou altere o filtro.</p> : null}
        </section>

        <section aria-labelledby="all-studies-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#b47d2e] dark:text-amber-400">Continue aprendendo</span>
              <h2 id="all-studies-heading" className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
                <Bookmark className="size-6 text-primary" aria-hidden="true" /> Estudos por tema
              </h2>
            </div>
            <span className="text-xs text-muted-foreground sm:text-sm">{studies.length} {studies.length === 1 ? "estudo" : "estudos"}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleStudies.map((study) => (
              <Card key={study.slug} className="flex flex-col rounded-2xl border-blue-100 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <BookOpen className="size-4" aria-hidden="true" /> {study.category}
                </div>
                <h3 className="mt-2 font-display text-lg font-bold leading-snug">{study.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{study.reference}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{study.summary}</p>
                <Button asChild size="sm" className="mt-4 w-full rounded-full bg-[#103e60] text-white hover:bg-[#15577e]">
                  <Link to="/estudos/$slug" params={{ slug: study.slug }}>Abrir estudo <ArrowRight className="ml-1 size-4" aria-hidden="true" /></Link>
                </Button>
              </Card>
            ))}
          </div>
          {studies.length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhum estudo encontrado para esta busca ou categoria.</p> : null}
          {!showAllStudies && studies.length > visibleStudies.length ? (
            <Button type="button" variant="outline" onClick={() => setShowAllStudies(true)} className="w-full rounded-full border-blue-200 text-primary sm:w-auto">
              Mostrar todos os {studies.length} estudos <ChevronDown className="ml-2 size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </section>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Clock3 className="size-4" aria-hidden="true" /> Os capítulos e estudos existentes permanecem disponíveis.
        </p>
      </div>
    </AppShell>
  );
}
