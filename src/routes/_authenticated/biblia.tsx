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
    if (index > 0) setPassage(BIBLE_BOOKS[index - 1], BIBLE_BOOKS[index - 1].chapters);
  };
  const next = () => {
    if (chapter < book.chapters) return setPassage(book, chapter + 1);
    const index = BIBLE_BOOKS.findIndex((item) => item.id === book.id);
    if (index < BIBLE_BOOKS.length - 1) setPassage(BIBLE_BOOKS[index + 1], 1);
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
    <AppShell title="Bíblia" subtitle="Leitura e consulta independente dos estudos.">
      <Card className="border-border/50 p-4 shadow-soft sm:p-6">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          Navegar na Bíblia
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <label className="grid gap-1.5 text-sm font-medium">
            Livro
            <select
              value={book.id}
              onChange={(event) => setPassage(getBibleBook(event.target.value), 1)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
          <label className="grid gap-1.5 text-sm font-medium">
            Capítulo
            <select
              value={chapter}
              onChange={(event) => setPassage(book, Number(event.target.value))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {Array.from({ length: book.chapters }, (_, index) => index + 1).map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previous}
            disabled={book.id === BIBLE_BOOKS[0].id && chapter === 1}
          >
            <ChevronLeft className="size-4" /> Anterior
          </Button>
          <p className="text-center font-display text-lg font-semibold" aria-live="polite">
            {reference}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={next}
            disabled={
              book.id === BIBLE_BOOKS[BIBLE_BOOKS.length - 1].id && chapter === book.chapters
            }
          >
            Próximo <ChevronRight className="size-4" />
          </Button>
        </div>
      </Card>
      <Card className="mt-4 border-amber-500/30 bg-amber-50/50 p-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
        <div className="flex gap-3">
          <BookOpen className="mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="font-display font-semibold">
              Texto bíblico aguardando fonte licenciada
            </h2>
            <p className="mt-1 text-sm leading-relaxed">
              A navegação canônica está pronta, mas o texto deste capítulo não é exibido até que
              seja registrada uma tradução com licença verificável para uso no aplicativo. Isso
              evita reproduzir conteúdo de procedência incerta.
            </p>
          </div>
        </div>
      </Card>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copyReference}>
          <Copy className="size-4" /> Copiar referência
        </Button>
        <Button variant="outline" size="sm" onClick={shareReference}>
          <Share2 className="size-4" /> Compartilhar referência
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Disponível quando houver texto licenciado"
        >
          <Star className="size-4" /> Favoritar versículo
        </Button>
      </div>
      <Card className="mt-6 border-border/50 p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <h2 className="font-display font-semibold">Pesquisa bíblica</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          A pesquisa de palavras e expressões será ativada junto com uma fonte de texto licenciada,
          por capítulo, sem carregar a Bíblia inteira no navegador.
        </p>
        <Input
          disabled
          className="mt-3"
          placeholder="Pesquisar texto bíblico (indisponível sem fonte licenciada)"
        />
      </Card>
      <p className="mt-5 text-xs text-muted-foreground">
        Licença e atribuição: consulte <code>docs-bible-license.md</code>. A leitura bíblica não
        altera o progresso da Formação de Pregadores.
      </p>
    </AppShell>
  );
}
