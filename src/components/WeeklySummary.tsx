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

/** Resumo semanal de hábitos, trilhas, diário e metas. */
export function WeeklySummary({
  summary,
  isLoading,
}: {
  summary: Summary | undefined;
  isLoading?: boolean;
}) {
  if (isLoading || !summary) {
    return <Skeleton className="h-56 w-full" />;
  }

  const maxPerDay = HABIT_ITEMS.length;

  return (
    <Card className="border-border/50 p-6 shadow-soft">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
        Resumo dos últimos 7 dias
      </p>

      <div className="mt-4 flex items-end justify-between gap-2">
        {summary.days.map((day) => {
          const height = Math.max(6, (day.done / maxPerDay) * 72);
          const weekday = WEEKDAYS[new Date(`${day.day}T12:00:00`).getDay()];
          return (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-[72px] w-full items-end">
                <div
                  className="w-full rounded-t-md bg-primary/80"
                  style={{ height: `${height}px` }}
                  title={`${day.done} de ${maxPerDay} hábitos`}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{weekday}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Hábitos concluídos" value={String(summary.habitTotal)} />
        <Metric label="Dias ativos" value={`${summary.activeDays}/7`} />
        <Metric label="Registros no diário" value={String(summary.journalCount)} />
        <Metric label="Metas concluídas" value={`${summary.goalsCompleted}/${summary.goalsTotal}`} />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium">
          Trilhas guiadas{" "}
          <span className="text-muted-foreground">
            ({summary.tracksCompleted} concluída(s))
          </span>
        </p>
        {summary.tracks.length ? (
          <div className="mt-3 space-y-3">
            {summary.tracks.slice(0, 4).map((track) => (
              <div key={track.slug}>
                <div className="flex items-center justify-between text-sm">
                  <span>{track.title}</span>
                  <span className="text-muted-foreground">
                    {track.completed}/{track.total}
                  </span>
                </div>
                <Progress value={track.percent} className="mt-1.5" />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Você ainda não iniciou uma trilha guiada.
          </p>
        )}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
