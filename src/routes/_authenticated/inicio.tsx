import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ExportCard } from "@/components/ExportCard";
import { WeeklySummary } from "@/components/WeeklySummary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard, getWeeklySummary, toggleHabit } from "@/lib/app.functions";
import { getDevotional } from "@/lib/ai.functions";
import { HABIT_ITEMS, todayISO } from "@/lib/types";


export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Caminhando com Cristo" },
      {
        name: "description",
        content: "Versículo do dia, oração, desafio espiritual e seu progresso diário.",
      },
      { property: "og:title", content: "Início — Caminhando com Cristo" },
      { property: "og:description", content: "Seu painel diário de comunhão com Deus." },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const day = todayISO();
  const queryClient = useQueryClient();
  const dashboard = useServerFn(getDashboard);
  const devotionalFn = useServerFn(getDevotional);
  const toggle = useServerFn(toggleHabit);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", day],
    queryFn: () => dashboard({ data: { day } }),
  });

  const devotional = useQuery({
    queryKey: ["devotional", day],
    queryFn: () => devotionalFn({ data: { day } }),
    staleTime: Infinity,
  });

  const summaryFn = useServerFn(getWeeklySummary);
  const summary = useQuery({
    queryKey: ["weekly-summary", day],
    queryFn: () => summaryFn({ data: { day } }),
  });


  const habitMutation = useMutation({
    mutationFn: (vars: { key: string; value: boolean }) =>
      toggle({ data: { day, key: vars.key, value: vars.value } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard", day] }),
    onError: () => toast.error("Não foi possível salvar o hábito."),
  });

  const habits = data?.habits ?? {};
  const doneCount = HABIT_ITEMS.filter((h) => habits[h.key]).length;
  const streak = countStreak(data?.history ?? []);
  const d = devotional.data;

  return (
    <AppShell title="Início" subtitle="Que a Palavra guie o seu dia.">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExportCard filename="devocional-do-dia" title="Meu devocional de hoje">
            <Card className="animate-rise border-border/50 p-6 shadow-soft">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Versículo do dia
              </p>
              {devotional.isLoading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
              ) : d ? (
                <>
                  <blockquote className="mt-3 font-display text-xl leading-relaxed">
                    “{d.verse.text}”
                  </blockquote>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {d.verse.reference}
                  </p>
                  <p className="mt-5 text-sm leading-relaxed">{d.motivational}</p>
                  <Button asChild variant="hero" size="sm" className="mt-6">
                    <Link to="/devocional">Abrir devocional completo</Link>
                  </Button>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Não conseguimos carregar o devocional agora. Tente novamente em instantes.
                </p>
              )}
            </Card>
          </ExportCard>
        </div>


        <Card className="animate-rise border-border/50 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Progresso espiritual
          </p>
          <p className="mt-3 font-display text-3xl font-semibold">
            {doneCount}/{HABIT_ITEMS.length}
          </p>
          <p className="text-sm text-muted-foreground">hábitos de hoje</p>
          <Progress value={(doneCount / HABIT_ITEMS.length) * 100} className="mt-4" />
          <p className="mt-4 text-sm text-muted-foreground">
            Sequência atual: <strong className="text-foreground">{streak} dia(s)</strong>
          </p>
        </Card>

        <Card className="animate-rise border-border/50 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Hábitos de hoje
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {isLoading
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-6 w-full" />)
              : HABIT_ITEMS.map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-3 text-sm">
                    <Checkbox
                      checked={Boolean(habits[item.key])}
                      onCheckedChange={(checked) =>
                        habitMutation.mutate({ key: item.key, value: Boolean(checked) })
                      }
                    />
                    {item.label}
                  </label>
                ))}
          </div>
        </Card>

        <Card className="animate-rise border-border/50 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Oração do dia
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            {d?.prayer ?? "Carregando sua oração de hoje..."}
          </p>
        </Card>

        <Card className="animate-rise border-border/50 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Desafio espiritual
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            {d?.challenge ?? "Carregando seu desafio de hoje..."}
          </p>
          {d?.readingSuggestion ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Leitura sugerida: <strong className="text-foreground">{d.readingSuggestion}</strong>
            </p>
          ) : null}
        </Card>

        <Card className="animate-rise border-border/50 p-6 shadow-soft lg:col-span-3">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Suas metas</p>
          {data?.goals?.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.goals.map((goal) => (
                <div key={goal.id}>
                  <p className="text-sm font-medium">{goal.title}</p>
                  <Progress
                    value={Math.min(100, (goal.progress / Math.max(1, goal.target)) * 100)}
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {goal.progress}/{goal.target} {goal.unit ?? ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Você ainda não definiu metas.{" "}
              <Link to="/metas" className="text-primary hover:underline">
                Criar minha primeira meta
              </Link>
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function countStreak(history: { day: string; habits: Record<string, boolean> }[]) {
  const active = new Set(
    history.filter((h) => Object.values(h.habits ?? {}).some(Boolean)).map((h) => h.day),
  );
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = new Date(cursor.getTime() - cursor.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    if (!active.has(iso)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
