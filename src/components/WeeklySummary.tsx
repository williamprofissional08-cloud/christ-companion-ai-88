import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
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
  if (isLoading || !summary) return <Skeleton className="h-28 w-full rounded-2xl" />;
  const maxPerDay = HABIT_ITEMS.length;
  const hasActivity = summary.habitTotal > 0 || summary.activeDays > 0 || summary.journalCount > 0 ||
    summary.goalsCompleted > 0 || summary.tracksCompleted > 0 ||
    summary.tracks.some((track) => track.completed > 0);

  return (
    <Card className="border-border/50 bg-white p-4 shadow-sm dark:bg-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Resumo dos últimos 7 dias</h2>
        {hasActivity ? <span className="text-xs text-muted-foreground">{summary.activeDays} dia(s) ativos</span> : null}
      </div>
      {!hasActivity ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Comece hoje, um passo de cada vez.</p>
          <Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/devocional">Começar hoje</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-2">
            {summary.days.map((day) => {
              const height = Math.max(4, (day.done / maxPerDay) * 44);
              const weekday = WEEKDAYS[new Date(`${day.day}T12:00:00`).getDay()];
              return <div key={day.day} className="flex flex-1 flex-col items-center gap-1.5"><div className="flex h-11 w-full items-end"><div className="w-full rounded-t-md bg-primary/75" style={{ height: `${height}px` }} title={`${day.done} de ${maxPerDay} hábitos`} /></div><span className="text-[10px] text-muted-foreground">{weekday}</span></div>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{summary.habitTotal}</strong> hábitos concluídos</span>
            <span><strong className="text-foreground">{summary.journalCount}</strong> registros no diário</span>
            {summary.tracksCompleted > 0 ? <span><strong className="text-foreground">{summary.tracksCompleted}</strong> trilhas concluídas</span> : null}
          </div>
        </>
      )}
    </Card>
  );
}
