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
      <div className="grid gap-4 md:grid-cols-2">
        {messages.isLoading ? <p className="text-sm text-muted-foreground">Carregando mensagens…</p> : null}
        {(messages.data ?? []).map((message) => (
          <Card key={message.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-display text-lg font-semibold">{message.title}</h2><p className="text-sm text-primary">{message.scripture_text}</p></div>
              <Button size="icon-sm" variant="ghost" aria-label="Excluir mensagem" onClick={() => deletion.mutate(message.id)}><Trash2 className="size-4" /></Button>
            </div>
            {message.objective ? <p className="text-sm"><strong>Objetivo:</strong> {message.objective}</p> : null}
            {message.introduction ? <p className="line-clamp-3 text-sm text-muted-foreground">{message.introduction}</p> : null}
            <p className="text-xs text-muted-foreground">Atualizada em {new Date(message.updated_at).toLocaleDateString("pt-BR")}</p>
          </Card>
        ))}
        {!messages.isLoading && !messages.data?.length ? (
          <Card className="col-span-full flex flex-col items-center gap-3 p-8 text-center"><FilePenLine className="size-8 text-primary" /><p className="text-sm text-muted-foreground">Seus esboços aparecerão aqui quando você salvar uma mensagem durante um estudo.</p></Card>
        ) : null}
      </div>
    </AppShell>
  );
}