import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Copy, Search, Share2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { addFavorite, getBibleChapter } from "@/lib/app.functions";
import { BIBLE_BOOKS, getBibleBook, parseBibleReference } from "@/lib/bible-catalog";

const searchSchema = z.object({
  livro: z.string().optional(),
  capitulo: z.coerce.number().int().positive().optional(),
  versiculo: z.coerce.number().int().positive().optional(),
  referencia: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/biblia")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Bíblia — Caminhando com Cristo" },
      { property: "og:description", content: "Leia os 66 livros da Bíblia Livre em português." },
      { title: "Bíblia — Caminhando com Cristo" },
      { name: "description", content: "Leia a Bíblia Livre completa em português do Brasil." },
    ],
  }),
  component: BibliaPage,
});

function BibliaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const getChapter = useServerFn(getBibleChapter);
  const saveFavorite = useServerFn(addFavorite);
  const parsedReference = parseBibleReference(search.referencia);
  const book = getBibleBook(search.livro ?? parsedReference?.livro);
  const chapter = Math.min(
    Math.max(search.capitulo ?? parsedReference?.capitulo ?? 1, 1),
    book.chapters,
  );
  const requestedVerse = search.versiculo ?? parsedReference?.versiculo;
  const [referenceInput, setReferenceInput] = useState("");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(requestedVerse ?? null);

  const chapterQuery = useQuery({
    queryKey: ["bible-chapter", "BLIVRE", book.id, chapter],
    queryFn: () => getChapter({ data: { bookId: book.id, chapter } }),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const verse =
    requestedVerse !== undefined &&
    chapterQuery.data?.verses.some((item) => item.number === requestedVerse)
      ? requestedVerse
      : undefined;
  const reference = `${book.name} ${chapter}${verse ? `:${verse}` : ""}`;

  useEffect(() => {
    setSelectedVerse(verse ?? null);
  }, [book.id, chapter, verse]);

  useEffect(() => {
    if (requestedVerse === undefined || !chapterQuery.data) return;
    if (chapterQuery.data.verses.some((item) => item.number === requestedVerse)) return;
    toast.error(`O versículo ${book.name} ${chapter}:${requestedVerse} não foi encontrado.`);
    void navigate({ search: { livro: book.id, capitulo: chapter } });
  }, [book.id, book.name, chapter, requestedVerse, chapterQuery.data, navigate]);

  useEffect(() => {
    if (!verse || !chapterQuery.data?.verses.some((item) => item.number === verse)) return;
    document
      .getElementById(`verse-${verse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [verse, chapterQuery.data]);

  const selectedVerseContent = chapterQuery.data?.verses.find(
    (item) => item.number === selectedVerse,
  );

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVerseContent) throw new Error("Selecione um versículo primeiro.");
      return saveFavorite({
        data: {
          kind: "versiculo",
          reference: `${book.name} ${chapter}:${selectedVerseContent.number}`,
          content: selectedVerseContent.text,
        },
      });
    },
    onSuccess: () => toast.success("Versículo salvo nos favoritos."),
    onError: () => toast.error("Não foi possível salvar o versículo."),
  });

  const setPassage = (nextBook = book, nextChapter = chapter) =>
    navigate({ search: { livro: nextBook.id, capitulo: nextChapter } });

  const previous = () => {
    if (chapter > 1) return setPassage(book, chapter - 1);
    const index = BIBLE_BOOKS.findIndex((item) => item.id === book.id);
    const previousBook = index > 0 ? BIBLE_BOOKS[index - 1] : undefined;
    if (previousBook) return setPassage(previousBook, previousBook.chapters);
    return undefined;
  };

  const next = () => {
    if (chapter < book.chapters) return setPassage(book, chapter + 1);
    const index = BIBLE_BOOKS.findIndex((item) => item.id === book.id);
    const nextBook = index >= 0 ? BIBLE_BOOKS[index + 1] : undefined;
    if (nextBook) return setPassage(nextBook, 1);
    return undefined;
  };

  const copyReference = async () => {
    await navigator.clipboard?.writeText(reference);
    toast.success("Referência copiada.");
  };

  const shareReference = async () => {
    if (navigator.share) await navigator.share({ title: "Bíblia", text: reference });
    else await copyReference();
  };

  const openReference = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseBibleReference(referenceInput);
    if (!parsed) {
      toast.error("Referência inválida. Exemplo: João 3:16.");
      return;
    }
    void navigate({
      search: {
        livro: parsed.livro,
        capitulo: parsed.capitulo,
        ...(parsed.versiculo ? { versiculo: parsed.versiculo } : {}),
      },
    });
  };

  return (
    <AppShell title="Bíblia" subtitle="Leia, medite e viva a Palavra de Deus.">
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        <section
          aria-labelledby="bible-heading"
          className="flex items-center gap-4 px-1 py-2 sm:py-4"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-blue-200/70 bg-blue-50 text-[#173565] shadow-sm dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200 sm:size-16">
            <BookOpen aria-hidden="true" className="size-8 sm:size-9" />
          </div>
          <div>
            <h1
              id="bible-heading"
              className="font-display text-3xl font-bold tracking-tight text-[#142d59] dark:text-foreground sm:text-4xl"
            >
              Bíblia
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Bíblia Livre (BLIVRE) · português do Brasil
            </p>
          </div>
        </section>

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-card p-4 shadow-soft sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            Navegar na Bíblia
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(10rem,1fr)]">
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Livro
              <select
                value={book.id}
                onChange={(event) => setPassage(getBibleBook(event.target.value), 1)}
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                <optgroup label="Antigo Testamento">
                  {BIBLE_BOOKS.filter((item) => item.testament === "AT").map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Novo Testamento">
                  {BIBLE_BOOKS.filter((item) => item.testament === "NT").map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Capítulo
              <select
                value={chapter}
                onChange={(event) => setPassage(book, Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Array.from({ length: book.chapters }, (_, index) => index + 1).map((number) => (
                  <option key={number} value={number}>
                    {number}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <section
          aria-label={`Capítulo selecionado: ${reference}`}
          className="rounded-2xl border border-border/60 bg-card px-4 py-5 shadow-soft sm:px-7 sm:py-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                Leitura · BLIVRE
              </p>
              <h2
                className="font-display text-3xl font-bold tracking-tight text-[#142d59] dark:text-foreground sm:text-4xl"
                aria-live="polite"
              >
                {reference}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione o número de um versículo para destacá-lo e salvá-lo.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="outline"
                className="min-h-11 flex-1 rounded-xl sm:flex-none"
                onClick={previous}
                disabled={book.id === BIBLE_BOOKS[0]?.id && chapter === 1}
                aria-label="Ir ao capítulo anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
              </Button>
              <Button
                className="min-h-11 flex-1 rounded-xl bg-blue-700 text-white hover:bg-blue-800 sm:flex-none"
                onClick={next}
                disabled={book.id === BIBLE_BOOKS.at(-1)?.id && chapter === book.chapters}
                aria-label="Ir ao próximo capítulo"
              >
                Próximo <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="mt-5" aria-live="polite">
            {chapterQuery.isPending && (
              <div className="space-y-3" aria-label="Carregando capítulo">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="mt-1 h-6 w-7 shrink-0 animate-pulse rounded bg-muted" />
                    <div className="mt-1 h-6 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            )}
            {chapterQuery.isError && (
              <div
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                role="alert"
              >
                <p className="font-semibold">Não foi possível carregar este capítulo.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verifique sua conexão e tente novamente.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 rounded-xl"
                  onClick={() => void chapterQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {chapterQuery.data && (
              <div className="space-y-1">
                {chapterQuery.data.verses.map((item) => (
                  <div
                    key={item.number}
                    id={`verse-${item.number}`}
                    className={`grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-xl border px-3 py-3 transition-colors ${selectedVerse === item.number ? "border-blue-300 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-950/40" : "border-transparent hover:border-border/60 hover:bg-muted/40"}`}
                  >
                    <button
                      type="button"
                      aria-label={`Selecionar ${book.name} ${chapter}:${item.number}`}
                      aria-pressed={selectedVerse === item.number}
                      onClick={() => {
                        setSelectedVerse(item.number);
                        void navigate({
                          search: { livro: book.id, capitulo: chapter, versiculo: item.number },
                        });
                      }}
                      className="mt-0.5 flex size-8 items-center justify-center rounded-lg text-xs font-bold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.number}
                    </button>
                    <p className="m-0 min-w-0 select-text text-base leading-8 text-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              className="min-h-11 justify-start rounded-xl"
              onClick={copyReference}
            >
              <Copy aria-hidden="true" className="size-4 text-primary" /> Copiar referência
            </Button>
            <Button
              variant="outline"
              className="min-h-11 justify-start rounded-xl"
              onClick={shareReference}
            >
              <Share2 aria-hidden="true" className="size-4 text-primary" /> Compartilhar referência
            </Button>
            <Button
              variant="outline"
              className="min-h-11 justify-start rounded-xl"
              disabled={!selectedVerseContent || favoriteMutation.isPending}
              onClick={() => favoriteMutation.mutate()}
              title={
                selectedVerseContent
                  ? "Salvar versículo nos favoritos"
                  : "Selecione um versículo primeiro"
              }
            >
              <Star aria-hidden="true" className="size-4 text-amber-600" />
              {favoriteMutation.isPending ? "Salvando…" : "Favoritar versículo"}
            </Button>
          </div>
        </section>

        <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
          <form onSubmit={openReference}>
            <div className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-4 text-primary" />
              <h2 className="font-display font-semibold">Ir para uma referência</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Digite um livro, capítulo e, se quiser, o versículo — por exemplo, João 3:16.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Referência bíblica"
                value={referenceInput}
                onChange={(event) => setReferenceInput(event.target.value)}
                className="h-11 rounded-xl"
                placeholder="Ex.: João 3:16"
              />
              <Button
                type="submit"
                className="min-h-11 rounded-xl bg-blue-700 text-white hover:bg-blue-800"
              >
                Abrir passagem
              </Button>
            </div>
          </form>
        </Card>

        <p className="px-1 pb-2 text-xs leading-relaxed text-muted-foreground">
          Bíblia Livre (BLIVRE), Copyright © 2018 Diego Santos, Mario Sérgio e Marco Teles. Licença
          CC BY 4.0 Brasil.{" "}
          <a
            className="font-medium text-primary underline underline-offset-2"
            href="https://ebible.org/porbr2018/copyright.htm"
            target="_blank"
            rel="noreferrer"
          >
            Créditos e licença
          </a>{" "}
          ·{" "}
          <a
            className="font-medium text-primary underline underline-offset-2"
            href="https://ebible.org/porbr2018/"
            target="_blank"
            rel="noreferrer"
          >
            Fonte oficial
          </a>
          .
        </p>
      </div>
    </AppShell>
  );
}
