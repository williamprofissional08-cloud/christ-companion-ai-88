import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { HABIT_ITEMS } from "@/lib/types";

type Summary = {
  days: { day: string; done: number }[];
  habitTotal: number;
  activeDays: number;
  journalCount: number;
  goalsCompleted: number;
  goalsTotal: number;
  tracks: { slug: string; title: string; completed: number; total: number; percent: number }[];
  tracksCompleted: number;
};
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function WeeklySummary({ summary, isLoading }: { summary: Summary | undefined; isLoading?: boolean }) {
  if (isLoading || !summary) return <Card className="border-border/50 p-4 shadow-soft"><Skeleton className="h-20 w-full" /></Card>;
  const hasActivity = summary.habitTotal > 0 || summary.activeDays > 0 || summary.journalCount > 0 || summary.tracks.length > 0 || summary.goalsCompleted > 0;
  return (
    <Card className="border-border/50 p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold">Resumo dos últimos 7 dias</h2>
        <span className="text-xs text-muted-foreground">{summary.activeDays}/7 dias ativos</span>
      </div>
      {!hasActivity ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Comece hoje, um passo de cada vez.</p>
          <Link to="/devocional" className="text-sm font-semibold text-primary hover:underline">Começar hoje</Link>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-2">
            {summary.days.map((day) => {
              const height = Math.max(4, (day.done / HABIT_ITEMS.length) * 36);
              const weekday = WEEKDAYS[new Date(`${day.day}T12:00:00`).getDay()];
              return <div key={day.day} className="flex flex-1 flex-col items-center gap-1"><div className="flex h-9 w-full items-end"><div className="w-full rounded-t bg-primary/75" style={{ height: `${height}px` }} title={`${day.done} de ${HABIT_ITEMS.length} hábitos`} /></div><span className="text-[10px] text-muted-foreground">{weekday}</span></div>;
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{summary.habitTotal}</strong> hábitos concluídos</span>
            <span><strong className="text-foreground">{summary.journalCount}</strong> registros no diário</span>
            <span><strong className="text-foreground">{summary.goalsCompleted}/{summary.goalsTotal}</strong> metas concluídas</span>
            <span><strong className="text-foreground">{summary.tracksCompleted}</strong> trilhas concluídas</span>
          </div>
          {summary.tracks.length > 0 ? <div className="mt-3 space-y-2">{summary.tracks.slice(0, 2).map((track) => <div key={track.slug}><div className="mb-1 flex justify-between text-xs"><span>{track.title}</span><span className="text-muted-foreground">{track.completed}/{track.total}</span></div><Progress value={track.percent} className="h-1.5" /></div>)}</div> : null}
        </>
      )}
    </Card>
  );
}
