import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { BookOpen, ChevronLeft, ChevronRight, Copy, Search, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      { property: "og:description", content: "Navegue pelos 66 livros e capítulos da Bíblia." },
      { title: "Bíblia — Caminhando com Cristo" },
      { name: "description", content: "Navegue pelos 66 livros e capítulos da Bíblia." },
    ],
  }),
  component: BibliaPage,
});

function BibliaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const parsedReference = parseBibleReference(search.referencia);
  const book = getBibleBook(search.livro ?? parsedReference?.livro);
  const chapter = Math.min(
    Math.max(search.capitulo ?? parsedReference?.capitulo ?? 1, 1),
    book.chapters,
  );
  const verse = search.versiculo ?? parsedReference?.versiculo;
  const reference = `${book.name} ${chapter}${verse ? `:${verse}` : ""}`;
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

  return (
    <AppShell title="Bíblia" subtitle="Leia, medite e viva a Palavra de Deus.">
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        <section aria-labelledby="bible-heading" className="flex items-center gap-4 px-1 py-2 sm:py-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-blue-200/70 bg-blue-50 text-[#173565] shadow-sm dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200 sm:size-16">
            <BookOpen aria-hidden="true" className="size-8 sm:size-9" />
          </div>
          <div>
            <h1 id="bible-heading" className="font-display text-3xl font-bold tracking-tight text-[#142d59] dark:text-foreground sm:text-4xl">Bíblia</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">Leia, medite e viva a Palavra de Deus.</p>
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
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Novo Testamento">
                  {BIBLE_BOOKS.filter((item) => item.testament === "NT").map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
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
                  <option key={number} value={number}>{number}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <section aria-label={`Capítulo selecionado: ${reference}`} className="rounded-2xl border border-border/60 bg-card px-4 py-5 shadow-soft sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-[0.15em] text-primary uppercase">Leitura bíblica</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#142d59] dark:text-foreground sm:text-4xl" aria-live="polite">{reference}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Navegação por livro e capítulo</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" className="min-h-11 flex-1 rounded-xl sm:flex-none" onClick={previous} disabled={book.id === BIBLE_BOOKS[0]?.id && chapter === 1} aria-label="Ir ao capítulo anterior">
                <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
              </Button>
              <Button className="min-h-11 flex-1 rounded-xl bg-blue-700 text-white hover:bg-blue-800 sm:flex-none" onClick={next} disabled={book.id === BIBLE_BOOKS.at(-1)?.id && chapter === book.chapters} aria-label="Ir ao próximo capítulo">
                Próximo <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <Card className="mt-5 rounded-xl border-amber-400/40 bg-amber-50/70 p-4 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/25 dark:text-amber-100 sm:p-5">
            <div className="flex gap-3">
              <BookOpen aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />
              <div>
                <h3 className="font-display font-semibold">Texto bíblico aguardando fonte licenciada</h3>
                <p className="mt-1 text-sm leading-relaxed text-amber-950/80 dark:text-amber-100/85">
                  A navegação canônica está pronta, mas o texto deste capítulo não é exibido até que seja registrada uma tradução com licença verificável para uso no aplicativo. Isso evita reproduzir conteúdo de procedência incerta.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" className="min-h-11 justify-start rounded-xl" onClick={copyReference}>
              <Copy aria-hidden="true" className="size-4 text-primary" /> Copiar referência
            </Button>
            <Button variant="outline" className="min-h-11 justify-start rounded-xl" onClick={shareReference}>
              <Share2 aria-hidden="true" className="size-4 text-primary" /> Compartilhar referência
            </Button>
            <Button variant="outline" className="min-h-11 justify-start rounded-xl" disabled title="Disponível quando houver texto licenciado">
              <Star aria-hidden="true" className="size-4 text-amber-600" /> Favoritar versículo
            </Button>
          </div>
        </section>

        <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
          <div className="flex items-center gap-2">
            <Search aria-hidden="true" className="size-4 text-primary" />
            <h2 className="font-display font-semibold">Pesquisa bíblica</h2>
            <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Em breve</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A pesquisa de palavras e expressões será ativada junto com uma fonte de texto licenciada, por capítulo, sem carregar a Bíblia inteira no navegador.
          </p>
          <Input disabled aria-label="Pesquisar texto bíblico" className="mt-3 h-11 rounded-xl" placeholder="Pesquisar texto bíblico (indisponível sem fonte licenciada)" />
        </Card>

        <p className="px-1 pb-2 text-xs leading-relaxed text-muted-foreground">
          Licença e atribuição: consulte <code className="rounded bg-muted px-1 py-0.5">docs-bible-license.md</code>. A leitura bíblica não altera o progresso da Formação de Pregadores.
        </p>
      </div>
    </AppShell>
  );
}
