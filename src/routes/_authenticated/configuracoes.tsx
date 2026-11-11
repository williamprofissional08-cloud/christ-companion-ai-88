import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, BellRing, Send, ShieldCheck } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditor } from "@/components/settings/ProfileEditor";


export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  async function updateAccountEmail() {
    const normalized = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (normalized === user?.email?.toLowerCase()) {
      toast.error("Este já é o e-mail atual da conta.");
      return;
    }
    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: normalized });
      if (error) throw error;
      toast.success("Solicitação enviada. Confirme a alteração pelo link enviado ao e-mail.");
      setNewEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o e-mail.");
    } finally {
      setUpdatingEmail(false);
    }
  }

  async function updateAccountPassword() {
    if (newPassword.length < 6) {
      toast.error("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não conferem.");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso.");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a senha.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function switchAccount() {
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      queryClient.clear();
      navigate({ to: "/auth", replace: true });
    } catch {
      toast.error("Não foi possível encerrar sua sessão. Tente novamente.");
    } finally {
      setSigningOut(false);
    }
  }
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
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [repeat, setRepeat] = useState("diario");
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setInterests(data.interests ?? []);
    setGoal(data.daily_goal ?? "");
    setTime(data.reminder_time ?? "07:00");
    setMinutes(data.reading_minutes ?? 10);
    setChallenge(data.challenge_type ?? "equilibrado");
    setReminders(data.reminders_enabled ?? true);
    setTimezone(data.timezone ?? "America/Sao_Paulo");
    setRepeat(data.reminder_repeat ?? "diario");
    setPausedUntil(data.reminder_paused_until ?? null);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (overrides?: { reminder_paused_until?: string | null }) =>
      persist({
        data: {
          interests,
          daily_goal: goal.trim() ? goal.trim() : null,
          reminder_time: time,
          reading_minutes: minutes,
          challenge_type: challenge,
          reminders_enabled: reminders,
          timezone,
          reminder_repeat: repeat,
          reminder_paused_until: pausedUntil,
          onboarding_completed: true,
          ...(overrides ?? {}),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas.");
    },
    onError: () => toast.error("Não foi possível salvar agora."),
  });

  function applyPause(days: string) {
    const value =
      days === "0" ? null : new Date(Date.now() + Number(days) * 86400000).toISOString();
    setPausedUntil(value);
    mutation.mutate({ reminder_paused_until: value });
  }

  const pauseActive = pausedUntil && new Date(pausedUntil).getTime() > Date.now();


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
      <div className="mx-auto w-full max-w-6xl space-y-5 pb-8 sm:space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2"><ProfileEditor /></div>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-soft sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <ShieldCheck className="size-5" aria-hidden />
                </div>
                <div>
                  <h2 className="font-display font-semibold">Painel administrativo</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acesso rápido à administração do Caminho Divino.
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link to="/admin">
                  Abrir painel <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
        </Card>
        <Card className="overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-soft sm:p-6">
          <div className="mb-4 border-b border-border/60 pb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Sua rotina diária</p>
          <h2 className="font-display text-xl font-semibold">Lembretes</h2>
          <p className="text-sm text-muted-foreground">
            Enviamos avisos de oração, devocional e leitura no horário escolhido, enquanto o app
            estiver aberto em uma aba.
          </p>
          </div>
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

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fuso">Fuso horário</Label>
              <select
                id="fuso"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIMEZONE_OPTIONS.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeticao">Repetição</Label>
              <select
                id="repeticao"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {REMINDER_REPEATS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label>Pausa temporária</Label>
            <p className="text-xs text-muted-foreground">
              {pauseActive
                ? `Lembretes pausados até ${new Date(pausedUntil!).toLocaleString("pt-BR")}.`
                : "Seus lembretes estão ativos. Pausar não apaga suas outras configurações."}
            </p>
            <div className="flex flex-wrap gap-2">
              {PAUSE_OPTIONS.map((item) => (
                <Button
                  key={item.key}
                  variant={
                    item.key === "0" ? (pauseActive ? "outline" : "gold") : "outline"
                  }
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={() => applyPause(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
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
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const sent = await sendTestReminder();
                toast[sent ? "success" : "error"](
                  sent
                    ? "Lembrete de teste enviado agora."
                    : "Libere as notificações do navegador para testar.",
                );
              }}
            >
              <Send className="size-4" /> Testar lembrete agora
            </Button>
          </div>

        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-soft sm:p-6">
          <div className="mb-4 border-b border-border/60 pb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Crescimento espiritual</p>
          <h2 className="font-display text-xl font-semibold">Leitura e desafio</h2>
          </div>
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

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-soft sm:p-6">
          <div className="mb-4 border-b border-border/60 pb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Personalização</p>
          <h2 className="font-display text-xl font-semibold">Interesses e objetivo</h2>
          </div>
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

        <Button className="w-full rounded-xl shadow-soft sm:w-auto lg:col-span-2 lg:justify-self-end" onClick={() => mutation.mutate(undefined)} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-soft sm:p-6 lg:col-span-2">
          <div className="mb-4 border-b border-border/60 pb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Segurança</p>
          <h2 className="font-display text-xl font-semibold">Conta e acesso</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Conta conectada: <span className="font-medium text-foreground">{user?.email ?? "E-mail indisponível"}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Para usar outra conta neste dispositivo, encerre a sessão atual e entre novamente com outro e-mail.
          </p>
          <div className="mt-5 grid gap-5 border-t pt-5">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void updateAccountEmail(); }}>
              <div>
                <Label htmlFor="account-new-email">Alterar e-mail</Label>
                <p className="mt-1 text-xs text-muted-foreground">A alteração só será concluída depois da confirmação solicitada pelo Supabase.</p>
              </div>
              <Input id="account-new-email" type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="novo@email.com" />
              <Button type="submit" size="sm" variant="outline" disabled={updatingEmail || !newEmail.trim()}>{updatingEmail ? "Enviando..." : "Solicitar alteração de e-mail"}</Button>
            </form>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void updateAccountPassword(); }}>
              <div>
                <Label htmlFor="account-new-password">Alterar senha</Label>
                <p className="mt-1 text-xs text-muted-foreground">Use pelo menos 6 caracteres e confirme a nova senha.</p>
              </div>
              <Input id="account-new-password" type="password" minLength={6} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Nova senha" />
              <Input id="account-confirm-password" type="password" minLength={6} autoComplete="new-password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} placeholder="Confirme a nova senha" />
              <Button type="submit" size="sm" variant="outline" disabled={updatingPassword || !newPassword || !confirmNewPassword}>{updatingPassword ? "Atualizando..." : "Atualizar senha"}</Button>
            </form>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={switchAccount}
            disabled={signingOut}
          >
            {signingOut ? "Saindo..." : "Sair e trocar de conta"}
          </Button>
        </Card>
        </div>
      </div>
    </AppShell>
  );
}
