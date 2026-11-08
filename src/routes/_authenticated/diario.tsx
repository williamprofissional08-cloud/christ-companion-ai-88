import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2 } from "lucide-react";
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
      <div className="mb-6">
        <WeeklySummary summary={summary.data} isLoading={summary.isLoading} />
      </div>
      <Card className="border-border/50 p-6 shadow-soft">
        <div className="flex flex-wrap gap-2">

          {JOURNAL_KINDS.map((item) => (
            <Button
              key={item.key}
              variant={kind === item.key ? "gold" : "outline"}
              size="sm"
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
          className="mt-4"
        />
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          placeholder="Escreva com liberdade..."
          className="mt-3"
        />
        <Button
          variant="hero"
          className="mt-4 gap-2"
          onClick={() => add.mutate()}
          disabled={add.isPending}
        >
          <Plus className="size-4" /> Salvar registro
        </Button>
      </Card>

      <div className="mt-6 grid gap-3">
        {entries.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : entries.data?.length ? (
          entries.data.map((entry) => (
            <Card key={entry.id} className="border-border/50 p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                    {JOURNAL_KINDS.find((k) => k.key === entry.kind)?.label ?? entry.kind}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold">{entry.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={entry.answered ? "gold" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => mark.mutate({ id: entry.id, answered: !entry.answered })}
                  >
                    <Check className="size-4" /> {entry.answered ? "Respondido" : "Marcar resposta"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir registro"
                    onClick={() => del.mutate(entry.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {entry.content ? (
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
              ) : null}
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Seu diário está vazio. Comece registrando um pedido de oração ou uma gratidão.
          </p>
        )}
      </div>
    </AppShell>
  );
}
