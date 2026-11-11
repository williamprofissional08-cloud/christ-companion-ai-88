import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ExportCard } from "@/components/ExportCard";
import { WeeklySummary } from "@/components/WeeklySummary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getDashboard, getWeeklySummary, toggleHabit } from "@/lib/app.functions";
import { getDevotional } from "@/lib/ai.functions";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { HABIT_ITEMS, todayISO } from "@/lib/types";
import { buildSteps, READING_TRACKS } from "@/lib/content/tracks";
import { listTrackProgress } from "@/lib/tracks.functions";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | Caminho Divino" },
      { name: "description", content: "Sua jornada diária com a Palavra de Deus." },
      { property: "og:title", content: "Caminho Divino" },
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
  const summaryFn = useServerFn(getWeeklySummary);
  const trackProgressFn = useServerFn(listTrackProgress);

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
  const summary = useQuery({
    queryKey: ["weekly-summary", day],
    queryFn: () => summaryFn({ data: { day } }),
  });
  const trackProgress = useQuery({
    queryKey: ["track-progress-all"],
    queryFn: () => trackProgressFn(),
  });

  const habitMutation = useMutation({
    mutationFn: (vars: { key: string; value: boolean }) =>
      toggle({ data: { day, key: vars.key, value: vars.value } }),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ["dashboard", day] });
      const previous = queryClient.getQueryData<NonNullable<typeof data>>(["dashboard", day]);
      if (previous) queryClient.setQueryData(["dashboard", day], {
        ...previous, habits: { ...(previous.habits ?? {}), [key]: value },
      });
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
  const metadata = user?.user_metadata ?? {};
  const displayName = String(metadata.full_name ?? metadata.name ?? user?.email?.split("@")[0] ?? "Olá").trim().split(" ")[0];
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const initials = displayName.slice(0, 1).toLocaleUpperCase("pt-BR");
  const activeTracks = (trackProgress.data ?? []).flatMap((row) => {
    const track = READING_TRACKS.find((item) => item.slug === row.track_slug);
    const completed = row.completed_steps?.length ?? 0;
    if (!track || completed === 0) return [];
    const total = buildSteps(track).length;
    return [{ track, total, completed, next: Math.min(total, completed + 1) }];
  });
  const activeTrack = activeTracks.sort((a, b) => b.completed - a.completed)[0];

  return (
    <AppShell title="Caminho Divino">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{greeting}, {displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Que a Palavra guie o seu dia.</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-white text-primary shadow-sm" aria-label="Avatar do usuário">
            {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initials ? <span className="font-semibold">{initials}</span> : <UserRound className="size-5" />}
          </div>
        </section>

        <ExportCard filename="versiculo-do-dia" title="Versículo do dia">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-5 shadow-sm dark:from-slate-800 dark:via-blue-950 dark:to-indigo-950 sm:p-6">
            <p className="text-[10px] font-bold tracking-[0.18em] text-blue-800 uppercase dark:text-blue-200">Versículo do dia</p>
            {devotional.isLoading ? (
              <div className="mt-4 space-y-2"><Skeleton className="h-7 w-full" /><Skeleton className="h-7 w-4/5" /></div>
            ) : d ? (
              <>
                <blockquote className="mt-3 max-w-3xl font-serif text-xl leading-relaxed text-slate-900 dark:text-white sm:text-2xl">“{d.verse.text}”</blockquote>
                <p className="mt-2 text-xs font-semibold text-blue-800 dark:text-blue-200">{d.verse.reference}</p>
                <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-relaxed text-slate-700 dark:text-slate-200">{d.motivational}</p>
                <Button asChild size="sm" className="mt-4 rounded-full bg-blue-700 text-white hover:bg-blue-800">
                  <Link to="/devocional">Abrir devocional completo</Link>
                </Button>
                {d.challenge ? <p className="mt-3 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200"><Sparkles className="mt-0.5 size-3.5 shrink-0" /><span><strong>Desafio de hoje:</strong> {d.challenge}</span></p> : null}
              </>
            ) : <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">Não conseguimos carregar o versículo agora. Tente novamente em instantes.</p>}
          </Card>
        </ExportCard>

        <Card className="border-border/50 bg-white p-4 shadow-sm dark:bg-card sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold">Progresso Espiritual</h2>
            <span className="text-sm font-medium text-muted-foreground">{doneCount}/7 hábitos de hoje</span>
          </div>
          <Progress value={(doneCount / HABIT_ITEMS.length) * 100} className="mt-3 h-2.5" />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Flame className="size-4 text-orange-500" /> Sequência atual: <strong className="text-foreground">{streak} dia(s)</strong></p>
          <div className="mt-4 border-t border-border/60 pt-3">
            <h3 className="mb-3 text-sm font-semibold">Hábitos de hoje</h3>
            {isLoading ? <div className="space-y-3">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}</div> : (
              <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                {HABIT_ITEMS.map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-3 text-sm">
                    <Checkbox className="size-5 rounded-full" checked={Boolean(habits[item.key])} onCheckedChange={(checked) => habitMutation.mutate({ key: item.key, value: Boolean(checked) })} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/50 bg-white p-4 shadow-sm dark:bg-card">
            <h2 className="text-xs font-bold tracking-wide text-primary uppercase">Oração do dia</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{d?.prayer ?? "Carregando sua oração de hoje..."}</p>
          </Card>
          <Card className="flex flex-col justify-center border-border/50 bg-white p-4 shadow-sm dark:bg-card">
            {activeTrack ? (
              <>
                <h2 className="text-xs font-bold tracking-wide text-primary uppercase">Continuar onde parei</h2>
                <p className="mt-2 text-sm font-medium">{activeTrack.track.title} · Lição {activeTrack.next} de {activeTrack.total}</p>
                <Button asChild size="sm" className="mt-3 w-fit rounded-full"><Link to="/trilhas/$slug" params={{ slug: activeTrack.track.slug }}>Continuar</Link></Button>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold">Comece sua primeira trilha</h2>
                <Button asChild size="sm" variant="outline" className="mt-3 w-fit rounded-full"><Link to="/trilhas">Explorar trilhas</Link></Button>
              </>
            )}
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-white px-4 py-3 text-sm shadow-sm dark:bg-card">
          <span className="text-muted-foreground">Suas metas</span>
          {data?.goals?.length ? (
            <Link to="/metas" className="font-medium text-primary hover:underline">{data.goals.length} meta(s) em andamento · Ver metas</Link>
          ) : (
            <span className="text-muted-foreground">Você ainda não definiu metas. <Link to="/metas" className="font-semibold text-primary hover:underline">Criar minha primeira meta</Link></span>
          )}
        </div>

        <section>
          <WeeklySummary summary={summary.data} isLoading={summary.isLoading} />
        </section>
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
