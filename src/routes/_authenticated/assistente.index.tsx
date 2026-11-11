import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, MessageCircleHeart, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createThread, deleteThread, listThreads } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/assistente/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Assistente bíblico — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Converse com um assistente com IA sobre a Bíblia: passagens, contexto histórico, parábolas e profecias.",
      },
      { property: "og:title", content: "Assistente bíblico" },
      {
        property: "og:description",
        content: "Respostas fundamentadas nas Escrituras, sempre com as referências citadas.",
      },
    ],
  }),
  component: ThreadsPage,
});

function ThreadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);

  const threads = useQuery({ queryKey: ["threads"], queryFn: () => list({}) });

  const newThread = useMutation({
    mutationFn: () => create({ data: {} }),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/assistente/$threadId", params: { threadId: id } });
    },
    onError: () => toast.error("Não foi possível criar a conversa."),
  });

  const removeThread = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["threads"] }),
    onError: () => toast.error("Não foi possível excluir a conversa."),
  });

  return (
    <AppShell
      title="Assistente bíblico"
      subtitle="Pergunte, estude e cresça na sua caminhada com Deus."
    >
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.09] via-card to-card p-5 shadow-soft sm:p-7">
          <div
            className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/[0.06]"
            aria-hidden="true"
          />
          <div className="relative flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-14">
              <MessageCircleHeart className="size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                A Bíblia tem respostas para a vida real.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Encontre orientação, compreenda as Escrituras e aplique a Palavra de Deus no seu dia
                a dia.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  variant="hero"
                  onClick={() => newThread.mutate()}
                  disabled={newThread.isPending}
                  className="gap-2 rounded-xl px-5"
                >
                  <Plus className="size-4" />{" "}
                  {newThread.isPending ? "Preparando conversa…" : "Nova conversa"}
                </Button>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen
                    className="size-3.5 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />{" "}
                  Respostas fundamentadas nas Escrituras
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="threads-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="threads-heading" className="text-base font-semibold tracking-tight">
                Suas conversas
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Retome seus estudos e perguntas recentes.
              </p>
            </div>
            <Sparkles className="size-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {threads.isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : threads.data?.length ? (
              threads.data.map((thread) => (
                <Card
                  key={thread.id}
                  className="group flex flex-row items-center gap-3 rounded-2xl border-border/60 bg-card p-4 shadow-soft transition-colors hover:border-primary/30 hover:bg-primary/[0.025]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate({ to: "/assistente/$threadId", params: { threadId: thread.id } })
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MessageCircleHeart className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{thread.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(thread.updated_at).toLocaleString("pt-BR")}
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir conversa"
                    onClick={() => removeThread.mutate(thread.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Card>
              ))
            ) : (
              <Card className="rounded-2xl border-dashed border-border/70 bg-muted/20 p-6 text-center shadow-none sm:col-span-2">
                <MessageCircleHeart className="mx-auto size-7 text-primary/70" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Sua jornada começa com uma pergunta.
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Nenhuma conversa ainda. Experimente perguntar: “O que significa a parábola do
                  semeador?”.
                </p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
