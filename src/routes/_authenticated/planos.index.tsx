import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PLAN_CATEGORIES, PRAYER_PLANS } from "@/lib/content/plans";

export const Route = createFileRoute("/_authenticated/planos/")({
  head: () => ({
    meta: [
      { title: "Planos de oração — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Planos de oração com leitura bíblica, oração, desafio diário, checklist e anotações.",
      },
      { property: "og:title", content: "Planos de oração" },
      { property: "og:description", content: "Ore com direção e constância todos os dias." },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const plans = PRAYER_PLANS.filter((plan) => {
    const matchesCategory = !category || plan.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || plan.title.toLowerCase().includes(q) || plan.summary.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <AppShell title="Planos de oração" subtitle="Escolha um plano e comece hoje.">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar plano (ansiedade, família, jejum...)"
        className="max-w-md"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant={category ? "outline" : "gold"} size="sm" onClick={() => setCategory(null)}>
          Todos
        </Button>
        {PLAN_CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={category === c ? "gold" : "outline"}
            size="sm"
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.slug} className="animate-rise border-border/50 p-5 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {plan.category} · {plan.days} dias
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold">{plan.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
            <p className="mt-3 text-xs text-muted-foreground">{plan.keyVerse}</p>
            <Button asChild variant="hero" size="sm" className="mt-4">
              <Link to="/planos/$slug" params={{ slug: plan.slug }}>
                Abrir plano
              </Link>
            </Button>
          </Card>
        ))}
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum plano encontrado para essa busca.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
