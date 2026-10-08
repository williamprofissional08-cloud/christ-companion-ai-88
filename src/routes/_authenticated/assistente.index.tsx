import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircleHeart, Plus, Trash2 } from "lucide-react";
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
    <AppShell title="Assistente bíblico" subtitle="Tudo fundamentado nas Escrituras.">
      <Button
        variant="hero"
        onClick={() => newThread.mutate()}
        disabled={newThread.isPending}
        className="gap-2"
      >
        <Plus className="size-4" /> Nova conversa
      </Button>

      <div className="mt-6 grid gap-3">
        {threads.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : threads.data?.length ? (
          threads.data.map((thread) => (
            <Card
              key={thread.id}
              className="flex flex-row items-center gap-3 border-border/50 p-4 shadow-soft"
            >
              <button
                type="button"
                onClick={() =>
                  navigate({ to: "/assistente/$threadId", params: { threadId: thread.id } })
                }
                className="flex flex-1 items-center gap-3 text-left"
              >
                <MessageCircleHeart className="size-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-medium">{thread.title}</span>
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
          <p className="text-sm text-muted-foreground">
            Nenhuma conversa ainda. Comece perguntando algo como “O que significa a parábola do
            semeador?”.
          </p>
        )}
      </div>
    </AppShell>
  );
}
