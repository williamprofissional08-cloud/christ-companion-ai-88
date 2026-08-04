import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
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

  const totalCompleted = goals.data?.filter((goal) => goal.completed).length ?? 0;

  return (
    <AppShell
      title="Metas espirituais"
      subtitle={
        goals.data?.length
          ? `${totalCompleted} de ${goals.data.length} metas concluídas.`
          : "Comece definindo sua primeira meta."
      }
    >
      <Card className="border-border/50 p-6 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nome da meta"
          />
          <Input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            inputMode="numeric"
            placeholder="Alvo"
          />
          <Input
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="Unidade"
          />
          <Button
            variant="hero"
            className="gap-2"
            disabled={add.isPending}
            onClick={() =>
              add.mutate({
                title: title.trim(),
                target: Math.max(1, Number(target) || 1),
                unit: unit.trim() || undefined,
              })
            }
          >
            <Plus className="size-4" /> Criar
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <Button
              key={s.title}
              variant="outline"
              size="sm"
              onClick={() => add.mutate({ title: s.title, target: s.target, unit: s.unit })}
            >
              + {s.title}
            </Button>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {goals.isLoading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : goals.data?.length ? (
          goals.data.map((goal) => {
            const percent = Math.round((goal.progress / Math.max(1, goal.target)) * 100);
            return (
              <Card key={goal.id} className="border-border/50 p-5 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{goal.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {goal.progress} / {goal.target} {goal.unit ?? ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir meta"
                    onClick={() => del.mutate(goal.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Progress value={percent} className="mt-3" />
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Diminuir progresso"
                    onClick={() =>
                      setProgress.mutate({ id: goal.id, progress: Math.max(0, goal.progress - 1) })
                    }
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Button
                    variant="gold"
                    size="icon"
                    aria-label="Aumentar progresso"
                    onClick={() => setProgress.mutate({ id: goal.id, progress: goal.progress + 1 })}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {goal.completed ? "Concluída — glória a Deus!" : `${percent}%`}
                  </span>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma meta ainda. Use as sugestões acima para começar.
          </p>
        )}
      </div>
    </AppShell>
  );
}
