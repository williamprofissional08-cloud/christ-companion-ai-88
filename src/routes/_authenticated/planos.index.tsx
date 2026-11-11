import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CalendarDays, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PLAN_CATEGORIES, PRAYER_PLANS } from "@/lib/content/plans";
import { getPublishedManagedCatalog } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/planos/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const catalogFn = useServerFn(getPublishedManagedCatalog);
  const { data: managedPlans = [] } = useQuery({
    queryKey: ["published-managed-catalog", "prayer_plan"],
    queryFn: () => catalogFn({ data: { kind: "prayer_plan" } }),
  });
  const catalog = new Map(PRAYER_PLANS.map((item) => [item.slug, item]));
  for (const item of managedPlans) {
    if (item.status === "archived") { catalog.delete(item.slug); continue; }
    const old = catalog.get(item.slug);
    const meta = item.metadata as Record<string, unknown>;
    catalog.set(item.slug, {
      slug: item.slug,
      title: String(meta["title"] ?? old?.title ?? item.slug),
      category: String(meta["category"] ?? old?.category ?? "Oração"),
      days: Number(meta["days"] ?? old?.days ?? 1),
      summary: String(meta["summary"] ?? old?.summary ?? ""),
      keyVerse: String(meta["keyVerse"] ?? old?.keyVerse ?? ""),
    });
  }
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const plans = [...catalog.values()].filter((plan) => {
    const matchesCategory = !category || plan.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || plan.title.toLowerCase().includes(q) || plan.summary.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
  const featured = plans[0];
  const otherPlans = plans.slice(1);

  return (
    <AppShell title="Planos de oração" subtitle="Escolha um plano e comece hoje.">
      <div className="mx-auto w-full max-w-6xl space-y-7 pb-8">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.09] via-card to-amber-500/[0.07] px-5 py-6 shadow-soft sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Uma jornada diária com Deus
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Planos de oração
            </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cresça em intimidade com Deus através de planos práticos e guiados.
            </p>
            <label className="relative mt-5 block max-w-xl">
              <span className="sr-only">Buscar planos de oração</span>
              <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar plano (ansiedade, família, jejum...)"
                className="h-12 rounded-xl border-border/70 bg-background/85 pl-10 shadow-sm"
              />
            </label>
          </div>
        </section>

        <section aria-label="Filtrar planos por categoria" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Explore por tema</h2>
            <span className="text-sm text-muted-foreground">{plans.length} {plans.length === 1 ? "plano" : "planos"}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            <Button variant={category ? "outline" : "gold"} size="sm" className="shrink-0 rounded-full px-4" onClick={() => setCategory(null)}>
              Todos
            </Button>
            {PLAN_CATEGORIES.map((c) => (
              <Button
                key={c}
                variant={category === c ? "gold" : "outline"}
                size="sm"
                className="shrink-0 rounded-full px-4"
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </section>

        {featured ? (
          <section aria-labelledby="featured-heading">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Comece por aqui</p>
                <h2 id="featured-heading" className="mt-1 font-display text-2xl font-bold text-foreground">Em destaque</h2>
              </div>
            </div>
            <Card className="relative overflow-hidden rounded-3xl border-primary/15 bg-card p-0 shadow-soft">
              <div className="grid md:grid-cols-[0.85fr_1.15fr]">
                <div className="relative isolate flex min-h-44 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-blue-950 p-6 text-primary-foreground sm:p-8">
                  <img src="/images/prayer-sunrise.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-primary/75 via-blue-900/80 to-blue-950/90" />
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                    <BookOpen aria-hidden="true" className="h-6 w-6 text-amber-300" />
                  </div>
                  <div className="relative z-10 mt-8">
                    <p className="text-sm font-medium text-white/75">Um passo de cada vez</p>
                    <p className="mt-1 font-display text-xl font-semibold">Permaneça na Palavra.</p>
                  </div>
                </div>
                <div className="flex flex-col p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{featured.category}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" /> {featured.days} dias
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground">{featured.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{featured.summary}</p>
                  <div className="mt-4 flex items-start gap-2 border-l-2 border-amber-400 pl-3 text-sm italic text-muted-foreground">
                    <span className="min-w-0">{featured.keyVerse}</span>
                  </div>
                  <Button asChild variant="hero" className="mt-5 h-11 w-full justify-between rounded-xl sm:w-auto sm:self-start">
                    <Link to="/planos/$slug" params={{ slug: featured.slug }}>
                      Abrir plano <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        <section aria-labelledby="all-plans-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Encontre seu próximo passo</p>
              <h2 id="all-plans-heading" className="mt-1 font-display text-2xl font-bold text-foreground">Outros planos para você</h2>
            </div>
          </div>
          {otherPlans.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {otherPlans.map((plan) => (
                <Card key={plan.slug} className="animate-rise group flex h-full flex-col rounded-2xl border-border/60 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{plan.category}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                      <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" /> {plan.days} dias
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-foreground">{plan.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <span className="line-clamp-1 text-xs text-muted-foreground">{plan.keyVerse}</span>
                    <Button asChild variant="outline" size="sm" className="shrink-0 rounded-lg border-primary/20 text-primary hover:bg-primary/5">
                      <Link to="/planos/$slug" params={{ slug: plan.slug }}>
                        Começar <ArrowRight aria-hidden="true" className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : !featured ? (
            <Card className="rounded-2xl border-dashed bg-muted/30 p-8 text-center">
              <Search aria-hidden="true" className="mx-auto h-7 w-7 text-muted-foreground/70" />
              <p className="mt-3 font-medium text-foreground">Nenhum plano encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Tente outra busca ou escolha uma categoria diferente.</p>
            </Card>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
