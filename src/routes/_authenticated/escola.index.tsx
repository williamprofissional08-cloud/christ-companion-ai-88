import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/escola/")({
  head: () => ({
    meta: [
      { title: "Escola Bíblica — Caminho Divino" },
      {
        name: "description",
        content: "Área reservada para os próximos conteúdos de estudo bíblico.",
      },
    ],
  }),
  component: EscolaPage,
});

function EscolaPage() {
  return (
    <AppShell
      title="Escola Bíblica"
      subtitle="Um espaço reservado para novos conteúdos de estudo da Palavra."
    >
      <Card className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <BookOpen className="size-8 text-primary" aria-hidden />
        </div>
        <h2 className="font-display text-xl font-semibold">Novos estudos em preparação</h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          A Escola Bíblica está sendo reorganizada. Em breve, este espaço receberá novos cursos,
          aulas e materiais de estudo bíblico.
        </p>
      </Card>
    </AppShell>
  );
}
