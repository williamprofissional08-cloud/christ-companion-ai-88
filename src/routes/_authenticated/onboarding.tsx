import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { completeOnboarding } from "@/lib/settings.functions";
import { CHALLENGE_TYPES, INTEREST_OPTIONS, READING_DURATIONS } from "@/lib/types";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Comece sua jornada — Caminhando com Cristo" },
      {
        name: "description",
        content: "Escolha seus interesses e defina seu objetivo espiritual diário.",
      },
      { property: "og:title", content: "Comece sua jornada" },
      { property: "og:description", content: "Personalize seu companheiro espiritual em 3 passos." },
    ],
  }),
  component: OnboardingPage,
});

const GOAL_SUGGESTIONS = [
  "Orar 15 minutos todos os dias",
  "Ler a Bíblia diariamente",
  "Fazer o devocional antes de começar o dia",
  "Memorizar um versículo por semana",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const save = useServerFn(completeOnboarding);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [time, setTime] = useState("07:00");
  const [minutes, setMinutes] = useState(10);
  const [challenge, setChallenge] = useState("equilibrado");

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          interests,
          daily_goal: goal.trim(),
          reminder_time: time,
          reading_minutes: minutes,
          challenge_type: challenge,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Tudo pronto! Que Deus abençoe sua caminhada.");
      navigate({ to: "/inicio", replace: true });
    },
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
  });

  function toggleInterest(item: string) {
    setInterests((current) =>
      current.includes(item) ? current.filter((i) => i !== item) : [...current, item],
    );
  }

  const canAdvance =
    (step === 0 && interests.length > 0) ||
    (step === 1 && goal.trim().length >= 3) ||
    step === 2;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <img src={logo} alt="" width={44} height={44} className="size-11" />
        <div>
          <h1 className="font-display text-xl font-semibold">Bem-vindo(a)!</h1>
          <p className="text-sm text-muted-foreground">Passo {step + 1} de 3</p>
        </div>
      </div>

      <Card className="border-border/50 p-6 shadow-soft">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Quais temas você quer aprofundar?
              </h2>
              <p className="text-sm text-muted-foreground">
                Usaremos isso para personalizar devocionais, trilhas e desafios.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((item) => {
                const active = interests.includes(item);
                return (
                  <button key={item} type="button" onClick={() => toggleInterest(item)}>
                    <Badge variant={active ? "default" : "outline"} className="cursor-pointer px-3 py-1.5 text-sm">
                      {item}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Qual é o seu objetivo espiritual diário?
              </h2>
              <p className="text-sm text-muted-foreground">
                Um compromisso simples e possível de cumprir hoje.
              </p>
            </div>
            <Input
              value={goal}
              maxLength={200}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Ex.: orar e ler a Bíblia todas as manhãs"
            />
            <div className="flex flex-wrap gap-2">
              {GOAL_SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setGoal(suggestion)}>
                  <Badge variant="outline" className="cursor-pointer px-3 py-1.5 text-sm">
                    {suggestion}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold">Sua rotina</h2>
              <p className="text-sm text-muted-foreground">
                Você pode mudar tudo isso depois em Configurações.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hora">Horário do lembrete</Label>
                <Input
                  id="hora"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração da leitura</Label>
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
            </div>
            <div className="space-y-2">
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
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Voltar
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Continuar
            </Button>
          ) : (
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canAdvance}>
              {mutation.isPending ? "Salvando..." : "Começar a caminhar"}
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
