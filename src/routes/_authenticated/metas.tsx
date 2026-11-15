import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Flame, Minus, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createGoal, deleteGoal, listGoals, updateGoal } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Metas espirituais — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Defina metas como ler a Bíblia inteira, orar diariamente, memorizar versículos e acompanhe o progresso.",
      },
      { property: "og:title", content: "Metas espirituais" },
      { property: "og:description", content: "Acompanhe seu crescimento com metas claras." },
    ],
  }),
  component: MetasPage,
});

const SUGESTOES = [
  { title: "Ler a Bíblia inteira", target: 1189, unit: "capítulos" },
  { title: "Orar diariamente", target: 365, unit: "dias" },
  { title: "Fazer devocional", target: 90, unit: "dias" },
  { title: "Memorizar versículos", target: 52, unit: "versículos" },
  { title: "Jejuar", target: 12, unit: "jejuns" },
  { title: "Evangelizar", target: 24, unit: "conversas" },
  { title: "Participar da igreja", target: 48, unit: "cultos" },
  { title: "Praticar atos de serviço", target: 30, unit: "atos" },
];

function MetasPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listGoals);
  const create = useServerFn(createGoal);
  const update = useServerFn(updateGoal);
  const remove = useServerFn(deleteGoal);

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("30");
  const [unit, setUnit] = useState("dias");

  const goals = useQuery({ queryKey: ["goals"], queryFn: () => list({}) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["goals"] });

  const add = useMutation({
    mutationFn: (vars: { title: string; target: number; unit?: string }) =>
      create({ data: vars }),
    onSuccess: () => {
      setTitle("");
      toast.success("Meta criada.");
      invalidate();
    },
    onError: () => toast.error("Verifique o título e o valor da meta."),
  });

  const setProgress = useMutation({
    mutationFn: (vars: { id: string; progress: number }) => update({ data: vars }),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
  });

  const totalGoals = goals.data?.length ?? 0;
  const totalCompleted = goals.data?.filter((goal) => goal.completed).length ?? 0;
  const overallPercent = totalGoals ? Math.round((totalCompleted / totalGoals) * 100) : 0;

  return (
    <AppShell
      title="Minhas metas"
      subtitle={
        totalGoals
          ? `${totalCompleted} de ${totalGoals} metas concluídas. Pequenos passos, uma grande caminhada com Deus.`
          : "Pequenos passos, uma grande caminhada com Deus."
      }
    >
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        <Card className="overflow-hidden rounded-3xl border-border/50 bg-card p-5 shadow-soft sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target aria-hidden="true" className="size-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Seu caminho de crescimento</p>
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {goals.isLoading ? "Acompanhe seu progresso" : `${totalCompleted} / ${totalGoals}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {totalGoals ? "metas concluídas" : "Defina uma meta para começar"}
                </p>
              </div>
            </div>
            <div className="w-full rounded-2xl bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 sm:w-auto sm:min-w-48">
              <div className="flex items-center gap-3">
                <Flame aria-hidden="true" className="size-7 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">Um passo de cada vez</p>
                  <p className="text-xs text-muted-foreground">Fidelidade no seu ritmo</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Progress value={overallPercent} aria-label={`Metas concluídas: ${overallPercent}%`} className="h-2.5" />
            <span className="min-w-10 text-right text-sm font-semibold text-primary">{overallPercent}%</span>
          </div>
        </Card>

        <Card className="rounded-3xl border-border/50 p-5 shadow-soft sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Criar uma meta</h2>
              <p className="text-sm text-muted-foreground">Escolha um objetivo para sua caminhada.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(90px,0.8fr)_minmax(110px,1fr)_auto]">
            <Input aria-label="Nome da meta" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome da meta" />
            <Input aria-label="Alvo da meta" value={target} onChange={(event) => setTarget(event.target.value)} inputMode="numeric" placeholder="Alvo" />
            <Input aria-label="Unidade da meta" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Unidade" />
            <Button
              variant="hero"
              className="gap-2 sm:px-6"
              disabled={add.isPending}
              onClick={() =>
                add.mutate({
                  title: title.trim(),
                  target: Math.max(1, Number(target) || 1),
                  ...(unit.trim() ? { unit: unit.trim() } : {}),
                })
              }
            >
              <Plus aria-hidden="true" className="size-4" /> Criar
            </Button>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sugestões para começar</p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <Button
                  key={s.title}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-primary/15 bg-primary/5 text-foreground hover:bg-primary/10"
                  disabled={add.isPending}
                  onClick={() => add.mutate({ title: s.title, target: s.target, unit: s.unit })}
                >
                  <Plus aria-hidden="true" className="mr-1 size-3" /> {s.title}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <section aria-labelledby="goal-list-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="goal-list-heading" className="font-display text-xl font-bold">Suas metas</h2>
              <p className="text-sm text-muted-foreground">Celebre cada pequeno avanço.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {goals.isLoading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)
            ) : goals.data?.length ? (
              goals.data.map((goal) => {
                const percent = Math.round((goal.progress / Math.max(1, goal.target)) * 100);
                return (
                  <Card key={goal.id} className="rounded-3xl border-border/50 p-5 shadow-soft transition-shadow hover:shadow-md sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${goal.completed ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                        {goal.completed ? <Check aria-hidden="true" className="size-6" /> : <BookOpen aria-hidden="true" className="size-6" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-semibold leading-snug">{goal.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {goal.progress} / {goal.target} {goal.unit ?? ""}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="-mr-2 -mt-2 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Excluir meta: ${goal.title}`} onClick={() => del.mutate(goal.id)}>
                            <Trash2 aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <Progress value={percent} aria-label={`Progresso de ${goal.title}: ${percent}%`} className="h-2 flex-1" />
                          <span className="w-10 text-right text-xs font-semibold text-muted-foreground">{percent}%</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <Button variant="outline" size="icon" aria-label={`Diminuir progresso de ${goal.title}`} onClick={() => setProgress.mutate({ id: goal.id, progress: Math.max(0, goal.progress - 1) })}>
                            <Minus aria-hidden="true" className="size-4" />
                          </Button>
                          <Button variant="gold" size="icon" aria-label={`Aumentar progresso de ${goal.title}`} onClick={() => setProgress.mutate({ id: goal.id, progress: goal.progress + 1 })}>
                            <Plus aria-hidden="true" className="size-4" />
                          </Button>
                          <span className="ml-1 text-sm text-muted-foreground">
                            {goal.completed ? "Concluída — glória a Deus!" : "Continue avançando"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="rounded-3xl border-dashed border-border/70 bg-muted/20 p-8 text-center md:col-span-2">
                <Target aria-hidden="true" className="mx-auto size-9 text-primary/60" />
                <p className="mt-3 font-medium">Nenhuma meta ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">Use as sugestões acima para dar o primeiro passo.</p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
