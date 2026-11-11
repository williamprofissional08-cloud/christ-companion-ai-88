import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteSermonMessage, listSermonMessages } from "@/lib/preacher-course.functions";

export const Route = createFileRoute("/_authenticated/minhas-mensagens")({
  head: () => ({ meta: [
    { title: "Minhas Mensagens — Caminhando com Cristo" },
    { name: "description", content: "Seus esboços de pregação bíblica salvos com segurança." },
    { property: "og:title", content: "Minhas Mensagens" },
    { property: "og:description", content: "Esboços bíblicos preparados durante seus estudos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MessagesPage,
});

function MessagesPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listSermonMessages);
  const remove = useServerFn(deleteSermonMessage);
  const messages = useQuery({ queryKey: ["sermon-messages"], queryFn: () => list() });
  const deletion = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Mensagem excluída."); queryClient.invalidateQueries({ queryKey: ["sermon-messages"] }); },
    onError: () => toast.error("Não foi possível excluir a mensagem."),
  });
  return (
    <AppShell title="Minhas Mensagens" subtitle="Esboços preparados durante seus estudos.">
      <section aria-label="Seus esboços de mensagem" className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><FilePenLine aria-hidden="true" className="size-5" /></span>
            <div><p className="font-display text-base font-semibold text-foreground">Seus esboços salvos</p><p className="text-sm text-muted-foreground">Mensagens preparadas ao longo dos seus estudos bíblicos.</p></div>
          </div>
          {!messages.isLoading && messages.data?.length ? <span className="w-fit rounded-full border border-primary/10 bg-background/80 px-3 py-1 text-sm font-medium text-primary">{messages.data.length} {messages.data.length === 1 ? "mensagem" : "mensagens"}</span> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {messages.isLoading ? <Card aria-live="polite" className="col-span-full rounded-2xl border-border/70 p-6 text-sm text-muted-foreground">Carregando mensagens…</Card> : null}
          {(messages.data ?? []).map((message) => (
            <Card key={message.id} className="group flex h-full flex-col gap-4 rounded-2xl border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <h2 className="font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">{message.title}</h2>
                  <p className="inline-flex max-w-full rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300">{message.scripture_text}</p>
                </div>
                <Button size="icon-sm" variant="ghost" aria-label={`Excluir mensagem: ${message.title}`} onClick={() => deletion.mutate(message.id)} disabled={deletion.isPending} className="shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2">
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
              {message.objective ? <p className="text-sm leading-relaxed text-foreground/90"><strong className="font-semibold text-foreground">Objetivo:</strong> {message.objective}</p> : null}
              {message.introduction ? <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{message.introduction}</p> : null}
              <div className="mt-auto border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">Atualizada em {new Date(message.updated_at).toLocaleDateString("pt-BR")}</p>
              </div>
            </Card>
          ))}
          {!messages.isLoading && !messages.data?.length ? (
            <Card className="col-span-full flex flex-col items-center gap-4 rounded-2xl border-dashed border-primary/20 bg-primary/[0.025] px-6 py-10 text-center sm:py-14">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><FilePenLine aria-hidden="true" className="size-7" /></span>
              <div className="max-w-md space-y-1.5"><h2 className="font-display text-lg font-semibold text-foreground">Suas mensagens começam aqui</h2><p className="text-sm leading-relaxed text-muted-foreground">Seus esboços aparecerão aqui quando você salvar uma mensagem durante um estudo.</p></div>
            </Card>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
