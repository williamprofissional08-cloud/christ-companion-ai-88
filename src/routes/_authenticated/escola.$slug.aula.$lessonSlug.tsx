import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/escola/$slug/aula/$lessonSlug")({
  head: () => ({
    meta: [{ title: "Escola Bíblica — Caminho Divino" }],
  }),
  component: LessonUnavailablePage,
});

function LessonUnavailablePage() {
  return (
    <AppShell title="Escola Bíblica" subtitle="Área em reorganização">
      <Card className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center">
        <BookOpen className="size-8 text-primary" aria-hidden />
        <h2 className="font-display text-xl font-semibold">Aulas em preparação</h2>
        <p className="text-sm text-muted-foreground">
          Este conteúdo foi retirado temporariamente da Escola Bíblica. Novos estudos serão
          disponibilizados futuramente.
        </p>
        <Button asChild variant="outline">
          <Link to="/escola">Voltar à Escola Bíblica</Link>
        </Button>
      </Card>
    </AppShell>
  );
}
