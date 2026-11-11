import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, ArrowRight, Route as RouteIcon } from "lucide-react";
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
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { HABIT_ITEMS, todayISO } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { buildSteps, READING_TRACKS } from "@/lib/content/tracks";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Início — Caminho Divino" },
      { name: "description", content: "Versículo do dia, oração e seu progresso diário." },
      { property: "og:title", content: "Início — Caminho Divino" },
      { property: "og:description", content: "Que a Palavra guie o seu dia." },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const day = todayISO();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const dashboard = useServerFn(getDashboard);
  const devotionalFn = useServerFn(getDevotional);
  const toggle = useServerFn(toggleHabit);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", day],
    queryFn: () => dashboard({ data: { day } }),
  });
  const devotional = useQuery({
    queryKey: ["devotional", day],
    queryFn: () => loadDevotionalSafely(day, () => devotionalFn({ data: { day } })),
    retry: false,
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
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["dashboard", day] });
      const previous = queryClient.getQueryData<typeof data>(["dashboard", day]);
      queryClient.setQueryData(["dashboard", day], (old: typeof data) =>
        old ? { ...old, habits: { ...old.habits, [vars.key]: vars.value } } : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["dashboard", day], context.previous);
      toast.error("Não foi possível salvar o hábito.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["dashboard", day] }),
  });

  const habits = data?.habits ?? {};
  const doneCount = HABIT_ITEMS.filter((h) => habits[h.key]).length;
  const streak = countStreak(data?.history ?? []);
  const d = devotional.data;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name ||
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Bem-vindo";
  const firstName = String(displayName).trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const trackRows = data?.trackProgress ?? [];
  const lastTrack = [...trackRows].sort((a, b) =>
    new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
  ).find((row) => (row.completed_steps?.length ?? 0) > 0);
  const track = lastTrack ? READING_TRACKS.find((item) => item.slug === lastTrack.track_slug) : undefined;
  const trackTotal = track ? buildSteps(track).length : 0;
  const completedSteps = lastTrack?.completed_steps?.length ?? 0;
  const trackStep = Math.min(completedSteps + 1, trackTotal || completedSteps + 1);

  return (
    <AppShell title="Início" subtitle="Que a Palavra guie o seu dia.">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xl font-semibold tracking-tight sm:text-2xl">{greeting}, {firstName}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Que a Palavra guie o seu dia.</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-primary/10 text-sm font-semibold text-primary" aria-label="Avatar do usuário">
            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
              <img src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="" className="size-full object-cover" />
            ) : firstName.slice(0, 1).toUpperCase()}
          </div>
        </div>

        <ExportCard filename="versiculo-do-dia" title="Versículo do dia">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-5 shadow-soft dark:from-slate-800 dark:via-blue-950 dark:to-indigo-950 sm:p-6">
            <p className="text-[10px] font-bold tracking-[0.18em] text-blue-800 uppercase dark:text-blue-200">Versículo do dia</p>
            {devotional.isLoading ? (
              <div className="mt-4 space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-4/5" /></div>
            ) : d ? (
              <>
                <blockquote className="mt-3 font-display text-xl leading-relaxed text-slate-900 dark:text-white sm:text-2xl">“{d.verse.text}”</blockquote>
                <p className="mt-2 text-sm font-semibold text-blue-800 dark:text-blue-200">{d.verse.reference}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{d.motivational}</p>
                <Button asChild size="sm" className="mt-4 bg-blue-800 text-white hover:bg-blue-900 dark:bg-blue-200 dark:text-blue-950">
                  <Link to="/devocional">Abrir devocional completo <ArrowRight className="ml-1 size-4" /></Link>
                </Button>
                {d.challenge ? <p className="mt-3 border-t border-blue-900/10 pt-2 text-xs text-slate-700 dark:border-white/15 dark:text-slate-200"><strong>Desafio de hoje:</strong> {d.challenge}</p> : null}
              </>
            ) : <p className="mt-4 text-sm text-muted-foreground">{devotional.error instanceof Error && devotional.error.message ? devotional.error.message : "Não conseguimos carregar o devocional agora. Tente novamente em instantes."}</p>}
          </Card>
        </ExportCard>

        <Card className="border-border/50 p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Progresso Espiritual</h2>
            <span className="text-sm font-semibold text-primary">{doneCount}/7 hábitos de hoje</span>
          </div>
          <Progress value={(doneCount / HABIT_ITEMS.length) * 100} className="mt-3 h-2.5" />
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Flame className="size-4 text-orange-500" /> Sequência atual: <strong className="text-foreground">{streak} dia(s)</strong></p>
          <div className="mt-4 border-t border-border/70 pt-3">
            <p className="mb-3 text-sm font-semibold">Hábitos de hoje</p>
            <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
              {isLoading ? [0,1,2,3].map((i) => <Skeleton key={i} className="h-6 w-full" />) : HABIT_ITEMS.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox className="size-5 rounded-full" checked={Boolean(habits[item.key])} onCheckedChange={(checked) => habitMutation.mutate({ key: item.key, value: Boolean(checked) })} />
                  <span className={habits[item.key] ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/50 p-4 shadow-soft">
            <p className="text-xs font-bold tracking-wide text-primary uppercase">Oração do dia</p>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed">{d?.prayer ?? "Carregando sua oração de hoje..."}</p>
          </Card>
          <Card className="flex flex-col justify-between border-border/50 p-4 shadow-soft">
            <div>
              <p className="text-xs font-bold tracking-wide text-primary uppercase">Continuar onde parei</p>
              {lastTrack && track ? (
                <p className="mt-2 text-sm leading-relaxed"><strong>Trilha Guiada: {track.title}</strong><br />Lição {trackStep} de {trackTotal}</p>
              ) : <p className="mt-2 text-sm text-muted-foreground">Comece sua primeira trilha.</p>}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
              {lastTrack && track ? <Link to="/trilhas/$slug" params={{ slug: track.slug }}>Continuar <ArrowRight className="ml-1 size-4" /></Link> : <Link to="/trilhas">Explorar trilhas <RouteIcon className="ml-1 size-4" /></Link>}
            </Button>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-4 py-3">
          <p className="text-sm"><strong>Suas metas</strong> <span className="text-muted-foreground">— Você ainda não definiu metas.</span></p>
          <Link to="/metas" className="text-sm font-semibold text-primary hover:underline">Criar minha primeira meta</Link>
        </div>

        <WeeklySummary summary={summary.data} isLoading={summary.isLoading} />
      </div>
    </AppShell>
  );
}

function countStreak(history: { day: string; habits: Record<string, boolean> }[]) {
  const active = new Set(history.filter((h) => Object.values(h.habits ?? {}).some(Boolean)).map((h) => h.day));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = new Date(cursor.getTime() - cursor.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (!active.has(iso)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
