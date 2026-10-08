import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getPlanDayContent } from "@/lib/ai.functions";
import { getPlanProgress, savePlanDay } from "@/lib/app.functions";
import { getPlan } from "@/lib/content/plans";

export const Route = createFileRoute("/_authenticated/planos/$slug")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Plano de oração — Caminhando com Cristo" },
      {
        name: "description",
        content: "Leitura, oração, desafio, checklist e anotações para cada dia do seu plano.",
      },
      { property: "og:title", content: "Plano de oração" },
      { property: "og:description", content: "Acompanhe seu plano de oração dia a dia." },
    ],
  }),
  component: PlanoDetalhe,
});

function PlanoDetalhe() {
  const { slug } = Route.useParams();
  const plan = getPlan(slug);
  const queryClient = useQueryClient();
  const progressFn = useServerFn(getPlanProgress);
  const dayFn = useServerFn(getPlanDayContent);
  const saveFn = useServerFn(savePlanDay);

  const [day, setDay] = useState(1);
  const [note, setNote] = useState("");

  const progress = useQuery({
    queryKey: ["plan-progress", slug],
    queryFn: () => progressFn({ data: { slug } }),
  });

  const content = useQuery({
    queryKey: ["plan-day", slug, day],
    queryFn: () => dayFn({ data: { slug, day } }),
    staleTime: Infinity,
    enabled: Boolean(plan),
  });

  const notes = (progress.data?.notes ?? {}) as Record<string, string>;
  useEffect(() => {
    setNote(notes[String(day)] ?? "");
  }, [day, progress.data]);

  const save = useMutation({
    mutationFn: (vars: { done: boolean; note?: string }) =>
      saveFn({ data: { slug, day, done: vars.done, note: vars.note } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan-progress", slug] }),
    onError: () => toast.error("Não foi possível salvar seu progresso."),
  });

  if (!plan) {
    return (
      <AppShell title="Plano não encontrado">
        <Button asChild variant="outline" size="sm">
          <Link to="/planos">Voltar aos planos</Link>
        </Button>
      </AppShell>
    );
  }

  const completed = new Set(progress.data?.completed_days ?? []);
  const done = completed.has(day);

  return (
    <AppShell title={plan.title} subtitle={`${plan.days} dias · ${plan.category}`}>
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
        <Link to="/planos">
          <ArrowLeft className="size-4" /> Planos
        </Link>
      </Button>

      <Card className="border-border/50 p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">{plan.summary}</p>
        <p className="mt-2 font-display text-base">{plan.keyVerse}</p>
        <Progress value={(completed.size / plan.days) * 100} className="mt-4" />
        <p className="mt-2 text-xs text-muted-foreground">
          {completed.size} de {plan.days} dias concluídos
        </p>
      </Card>

      <div className="mt-5 flex flex-wrap gap-2">
        {Array.from({ length: plan.days }, (_, i) => i + 1).map((d) => (
          <Button
            key={d}
            size="sm"
            variant={d === day ? "hero" : completed.has(d) ? "gold" : "outline"}
            onClick={() => setDay(d)}
          >
            {d}
          </Button>
        ))}
      </div>

      <Card className="mt-5 border-border/50 p-6 shadow-soft">
        {content.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : content.data ? (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Dia {day}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold">{content.data.title}</h2>
            </div>
            <Block label="Leitura bíblica" text={content.data.reading} />
            <Block label="Resumo da leitura" text={content.data.readingSummary} />
            <Block label="Meditação" text={content.data.meditation} />
            <Block label="Oração" text={content.data.prayer} />
            <Block label="Desafio do dia" text={content.data.challenge} />
            <Block label="Pergunta para reflexão" text={content.data.question} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Não conseguimos gerar este dia agora. Tente novamente em instantes.
          </p>
        )}

        <div className="mt-6 border-t border-border/60 pt-5">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <Checkbox
              checked={done}
              onCheckedChange={(checked) => save.mutate({ done: Boolean(checked) })}
            />
            Concluí o dia {day}
          </label>
          <p className="mt-5 text-xs font-semibold tracking-wide text-primary uppercase">
            Minhas anotações
          </p>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="O que Deus falou com você hoje?"
            className="mt-2"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => save.mutate({ done, note })}
            disabled={save.isPending}
          >
            Salvar anotação
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">{label}</p>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
