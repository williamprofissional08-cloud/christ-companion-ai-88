import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  LockKeyhole,
  NotebookPen,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { WeeklySummary } from "@/components/WeeklySummary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createJournalEntry,
  deleteJournalEntry,
  getWeeklySummary,
  listJournal,
  setJournalAnswered,
} from "@/lib/app.functions";
import { JOURNAL_KINDS, todayISO } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/diario")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Diário espiritual — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Registre pedidos de oração, respostas, testemunhos, gratidão e aprendizados com Deus.",
      },
      { property: "og:title", content: "Diário espiritual" },
      { property: "og:description", content: "Guarde o que Deus tem feito na sua caminhada." },
    ],
  }),
  component: DiarioPage,
});

function DiarioPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listJournal);
  const create = useServerFn(createJournalEntry);
  const answered = useServerFn(setJournalAnswered);
  const remove = useServerFn(deleteJournalEntry);

  const [kind, setKind] = useState<string>(JOURNAL_KINDS[0].key);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const entries = useQuery({ queryKey: ["journal"], queryFn: () => list({}) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["journal"] });

  const day = todayISO();
  const summaryFn = useServerFn(getWeeklySummary);
  const summary = useQuery({
    queryKey: ["weekly-summary", day],
    queryFn: () => summaryFn({ data: { day } }),
  });

  const add = useMutation({
    mutationFn: () => create({ data: { kind, title, content } }),
    onSuccess: () => {
      setTitle("");
      setContent("");
      toast.success("Registro salvo.");
      invalidate();
    },
    onError: () => toast.error("Informe um título com pelo menos 2 caracteres."),
  });

  const mark = useMutation({
    mutationFn: (vars: { id: string; answered: boolean }) => answered({ data: vars }),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
  });

  return (
    <AppShell title="Diário espiritual" subtitle="Escreva e guarde o que Deus tem feito.">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <header className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Um tempo para refletir
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Meu diário
            </h1>
            <p className="mt-2 max-w-xl text-base text-muted-foreground sm:text-lg">
              Um espaço para registrar o que Deus fala ao seu coração.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            <LockKeyhole aria-hidden="true" className="size-4" />
            <span>Seus registros são pessoais</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)] lg:items-start">
          <section aria-labelledby="reflection-title" className="space-y-4">
            <div className="flex items-center gap-3 px-1 text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-5 text-primary" />
              <p className="text-sm font-medium">
                Hoje, {new Date().toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <Card className="overflow-hidden rounded-3xl border-primary/10 bg-primary/[0.035] p-0 shadow-soft">
              <div className="flex items-start gap-3 px-5 pt-5 sm:px-7 sm:pt-7">
                <div className="mt-0.5 rounded-2xl bg-primary/10 p-2.5 text-primary">
                  <Sprout aria-hidden="true" className="size-6" />
                </div>
                <div>
                  <h2 id="reflection-title" className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    O que está no seu coração hoje?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                    Escreva com liberdade. Ele te escuta.
                  </p>
                </div>
              </div>

              <div className="m-3 space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:m-5 sm:p-6">
                <div className="flex flex-wrap gap-2" aria-label="Tipo de registro">
                  {JOURNAL_KINDS.map((item) => (
                    <Button
                      key={item.key}
                      variant={kind === item.key ? "gold" : "outline"}
                      size="sm"
                      className="rounded-full"
                      aria-pressed={kind === item.key}
                      onClick={() => setKind(item.key)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Título do registro"
                  aria-label="Título do registro"
                  className="h-12 rounded-xl bg-background px-4"
                />
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={6}
                  placeholder="Escreva com liberdade..."
                  aria-label="Conteúdo do registro"
                  className="min-h-36 resize-y rounded-xl bg-background p-4 leading-relaxed"
                />
                <Button
                  variant="hero"
                  className="h-12 w-full gap-2 rounded-xl text-base sm:w-auto sm:min-w-52"
                  onClick={() => add.mutate()}
                  disabled={add.isPending}
                >
                  <Plus aria-hidden="true" className="size-4" /> Salvar registro
                </Button>
              </div>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card className="rounded-3xl border-border/50 p-4 shadow-soft sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <NotebookPen aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Meu histórico</h2>
                  <p className="text-sm text-muted-foreground">Sua caminhada, dia após dia.</p>
                </div>
              </div>
              <WeeklySummary summary={summary.data} isLoading={summary.isLoading} />
            </Card>

            <section aria-label="Registros anteriores" className="space-y-3">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="font-display text-lg font-semibold">Registros anteriores</h2>
                {entries.data?.length ? (
                  <span className="text-sm text-muted-foreground">{entries.data.length} registros</span>
                ) : null}
              </div>
              {entries.isLoading ? (
                [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
              ) : entries.data?.length ? (
                entries.data.map((entry) => (
                  <Card key={entry.id} className="rounded-2xl border-border/50 p-4 shadow-soft sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                          {JOURNAL_KINDS.find((k) => k.key === entry.kind)?.label ?? entry.kind}
                        </p>
                        <h3 className="mt-1 break-words font-display text-lg font-semibold">{entry.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={entry.answered ? "gold" : "outline"}
                          size="sm"
                          className="gap-2 rounded-full"
                          onClick={() => mark.mutate({ id: entry.id, answered: !entry.answered })}
                        >
                          <Check aria-hidden="true" className="size-4" />
                          {entry.answered ? "Respondido" : "Marcar resposta"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir registro: ${entry.title}`}
                          onClick={() => del.mutate(entry.id)}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {entry.content ? (
                      <p className="mt-3 border-t border-border/50 pt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {entry.content}
                      </p>
                    ) : null}
                  </Card>
                ))
              ) : (
                <Card className="rounded-2xl border-dashed border-border/70 bg-muted/20 p-6 text-center">
                  <NotebookPen aria-hidden="true" className="mx-auto mb-3 size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Seu diário está vazio. Comece registrando um pedido de oração ou uma gratidão.
                  </p>
                </Card>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
