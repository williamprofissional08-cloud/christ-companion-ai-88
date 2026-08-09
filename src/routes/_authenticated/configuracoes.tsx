import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BellRing, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings, saveSettings } from "@/lib/settings.functions";
import {
  CHALLENGE_TYPES,
  INTEREST_OPTIONS,
  PAUSE_OPTIONS,
  READING_DURATIONS,
  REMINDER_REPEATS,
  TIMEZONE_OPTIONS,
} from "@/lib/types";
import { requestNotificationPermission, sendTestReminder } from "@/hooks/use-reminders";


export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Caminhando com Cristo" },
      {
        name: "description",
        content: "Ajuste horário de lembrete, duração da leitura e tipo de desafio espiritual.",
      },
      { property: "og:title", content: "Configurações da sua rotina espiritual" },
      { property: "og:description", content: "Lembretes consistentes e conteúdo do seu jeito." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getSettings);
  const persist = useServerFn(saveSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
  });

  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [time, setTime] = useState("07:00");
  const [minutes, setMinutes] = useState(10);
  const [challenge, setChallenge] = useState("equilibrado");
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    if (!data) return;
    setInterests(data.interests ?? []);
    setGoal(data.daily_goal ?? "");
    setTime(data.reminder_time ?? "07:00");
    setMinutes(data.reading_minutes ?? 10);
    setChallenge(data.challenge_type ?? "equilibrado");
    setReminders(data.reminders_enabled ?? true);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      persist({
        data: {
          interests,
          daily_goal: goal.trim() ? goal.trim() : null,
          reminder_time: time,
          reading_minutes: minutes,
          challenge_type: challenge,
          reminders_enabled: reminders,
          onboarding_completed: true,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas.");
    },
    onError: () => toast.error("Não foi possível salvar agora."),
  });

  if (isLoading) {
    return (
      <AppShell title="Configurações">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Configurações" subtitle="Sua rotina, seus lembretes, seu ritmo">
      <div className="space-y-4">
        <Card className="border-border/50 p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Lembretes</h2>
          <p className="text-sm text-muted-foreground">
            Enviamos avisos de oração, devocional e leitura no horário escolhido, enquanto o app
            estiver aberto em uma aba.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hora">Horário</Label>
              <Input
                id="hora"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Lembretes ativos</p>
                <p className="text-xs text-muted-foreground">Oração, devocional e desafio</p>
              </div>
              <Switch checked={reminders} onCheckedChange={setReminders} />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={async () => {
              const granted = await requestNotificationPermission();
              toast[granted ? "success" : "error"](
                granted
                  ? "Notificações liberadas neste dispositivo."
                  : "Permissão de notificação não concedida.",
              );
            }}
          >
            <BellRing className="size-4" /> Ativar notificações do navegador
          </Button>
        </Card>

        <Card className="border-border/50 p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Leitura e desafio</h2>
          <div className="mt-4 space-y-2">
            <Label>Duração da leitura diária</Label>
            <div className="flex flex-wrap gap-2">
              {READING_DURATIONS.map((value) => (
                <button key={value} type="button" onClick={() => setMinutes(value)}>
                  <Badge
                    variant={minutes === value ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-sm"
                  >
                    {value} min
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Label>Tipo de desafio espiritual</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CHALLENGE_TYPES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setChallenge(item.key)}
                  className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                    challenge === item.key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-border/50 p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Interesses e objetivo</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="objetivo">Objetivo espiritual diário</Label>
            <Input
              id="objetivo"
              value={goal}
              maxLength={200}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Ex.: orar 15 minutos todos os dias"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((item) => {
              const active = interests.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setInterests((current) =>
                      current.includes(item)
                        ? current.filter((i) => i !== item)
                        : [...current, item],
                    )
                  }
                >
                  <Badge
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-sm"
                  >
                    {item}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </AppShell>
  );
}
