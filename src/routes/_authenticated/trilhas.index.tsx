import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, CheckCircle2, Compass, Heart, Mountain, Search, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { buildSteps, READING_TRACKS, TRACK_THEMES } from "@/lib/content/tracks";
import { listTrackProgress } from "@/lib/tracks.functions";

export const Route = createFileRoute("/_authenticated/trilhas/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Trilhas guiadas — Caminho Divino" },
      { name: "description", content: "Caminhe pelas Escrituras, um passo de cada vez, com Deus." },
      { property: "og:title", content: "Trilhas guiadas" },
      { property: "og:description", content: "Percursos bíblicos para crescer na Palavra." },
    ],
  }),
  component: TrilhasPage,
});

const FILTERS = ["Todas", "Ansiedade", "Fé", "Oração", "Perdão", "Propósito"] as const;

function TrilhasPage() {
  const [theme, setTheme] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const fetchProgress = useServerFn(listTrackProgress);
  const { data: progress } = useQuery({
    queryKey: ["track-progress-all"],
    queryFn: () => fetchProgress(),
  });

  const progressMap = useMemo(
    () => new Map((progress ?? []).map((row) => [row.track_slug, row.completed_steps?.length ?? 0])),
    [progress],
  );
  const featured = READING_TRACKS.find((track) => track.slug === "vencendo-a-ansiedade")!;
  const otherTracks = [
    { slug: "fe-que-move", theme: "FÉ", title: "Uma fé que fortalece", summary: "Caminhe pelas Escrituras e fortaleça sua confiança em Deus.", steps: 12, icon: Compass },
    { slug: "vida-de-oracao", theme: "ORAÇÃO", title: "Um coração em oração", summary: "Encontre momentos simples para conversar com Deus.", steps: 8, icon: Heart },
  ].map((item) => ({ ...item, track: READING_TRACKS.find((track) => track.slug === item.slug)! }));

  const matches = (item: { theme: string; title: string; summary: string }) => {
    const normalizedTheme = item.theme.toLocaleLowerCase("pt-BR");
    const filterMatch = theme === "Todas" || normalizedTheme === theme.toLocaleLowerCase("pt-BR");
    const searchMatch = `${item.title} ${item.summary} ${item.theme}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    return filterMatch && searchMatch;
  };
  const showFeatured = matches({ theme: featured.theme, title: "Encontrando paz em Deus", summary: "Pequenas reflexões para entregar suas preocupações e descansar no cuidado do Pai." });
  const visibleOthers = otherTracks.filter((item) => matches(item));

  return (
    <AppShell title="Trilhas guiadas" subtitle="Um passo de cada vez, com Deus.">
      <div className="mx-auto max-w-3xl space-y-7 pb-2">
        <section className="relative isolate overflow-hidden rounded-[1.6rem] border border-sky-100 bg-gradient-to-br from-[#f4f8f7] via-[#eaf3f4] to-[#dceaf0] px-5 py-6 sm:px-7">
          <div className="relative z-10 max-w-[72%] space-y-2 sm:max-w-[60%]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#42627d]">
              <Sparkles className="size-3.5" /> CAMINHE COM PROPÓSITO
            </span>
            <h1 className="font-display text-2xl font-semibold leading-tight text-[#183858] sm:text-3xl">Trilhas guiadas</h1>
            <p className="text-sm leading-relaxed text-[#526b7d]">Um passo de cada vez, com Deus.</p>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[48%] opacity-90">
            <svg viewBox="0 0 260 190" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
              <path d="M0 130 65 48 104 95 153 22 260 145V190H0Z" fill="#b8cfd5" />
              <path d="m65 48 20 24-20-7-17 16Zm88-26 31 44-31-13-25 16Z" fill="#f8fbfa" opacity=".9" />
              <path d="M0 145 80 91l50 49 55-56 75 61v45H0Z" fill="#8fb4b9" opacity=".8" />
              <path d="M120 190c-10-25 8-37 25-50 15-12 12-26 1-39 29 14 35 32 18 50-12 13-15 24-7 39Z" fill="#f7f4e9" opacity=".95" />
              <path d="M0 160c46-18 69-8 95 10 25 17 50 14 78-3 32-20 58-15 87 0v23H0Z" fill="#739c91" opacity=".55" />
              <circle cx="213" cy="34" r="13" fill="#f5e6bd" />
            </svg>
          </div>
        </section>

        <section className="space-y-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar uma trilha" className="h-12 rounded-2xl border-slate-200 bg-white pl-11 shadow-sm placeholder:text-slate-400" aria-label="Buscar uma trilha" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filtrar trilhas por tema">
            {FILTERS.map((item) => (
              <button key={item} type="button" onClick={() => setTheme(item)} aria-pressed={theme === item}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${theme === item ? "border-[#244f78] bg-[#244f78] text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"}`}>
                {item}
              </button>
            ))}
          </div>
        </section>

        {showFeatured ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-[#1d3553]">Continue sua caminhada</h2>
              <button type="button" onClick={() => { setTheme("Todas"); setQuery(""); }} className="shrink-0 text-xs font-semibold text-[#35658b]">Ver todas</button>
            </div>
            <Link to="/trilhas/$slug" params={{ slug: featured.slug }} className="block">
              <Card className="overflow-hidden rounded-3xl border-sky-100 bg-white p-0 shadow-[0_8px_28px_rgba(35,66,91,0.08)] transition-shadow hover:shadow-md">
                <div className="grid sm:grid-cols-[150px_1fr]">
                  <div className="relative min-h-36 overflow-hidden bg-gradient-to-br from-[#dcece8] via-[#c7dedb] to-[#a8c7c4] sm:min-h-full">
                    <svg viewBox="0 0 180 210" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                      <circle cx="132" cy="42" r="19" fill="#f7e9c7" />
                      <path d="m0 125 62-82 44 57 29-35 45 66v79H0Z" fill="#9ebfc0" />
                      <path d="m0 150 55-48 37 35 39-42 49 54v57H0Z" fill="#719b92" />
                      <path d="M78 210c-15-34 1-47 15-64 13-15 9-31-2-45 30 21 31 42 13 61-12 13-13 28-4 48Z" fill="#f5f1e6" />
                      <path d="M0 181c39-16 62-6 85 11 27 20 55 12 95-8v26H0Z" fill="#527c70" opacity=".65" />
                    </svg>
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#355d69]">PAZ E DESCANSO</span>
                  </div>
                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.16em] text-[#537a91]"><Mountain className="size-3.5" /> ANSIEDADE</div>
                    <h3 className="font-display text-xl font-semibold leading-tight text-[#1b3552]">Encontrando paz em Deus</h3>
                    <p className="text-sm leading-relaxed text-slate-600">Pequenas reflexões para entregar suas preocupações e descansar no cuidado do Pai.</p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-[#47677d]"><BookOpen className="size-3.5" /> Filipenses 4:6–7</p>
                    <div className="space-y-1.5">
                      <Progress value={((progressMap.get(featured.slug) ?? 0) / 12) * 100} className="h-2 bg-slate-100" />
                      <p className="text-xs tabular-nums text-slate-500">{progressMap.get(featured.slug) ?? 0} de 12 etapas</p>
                    </div>
                    <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#24527d] px-4 text-sm font-semibold text-white shadow-sm">
                      Começar trilha <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-[#1d3553]">Explore outras trilhas</h2>
            <button type="button" onClick={() => { setTheme("Todas"); setQuery(""); }} className="shrink-0 text-xs font-semibold text-[#35658b]">Ver todas</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleOthers.map((item) => {
              const done = progressMap.get(item.slug) ?? 0;
              const Icon = item.icon;
              return (
                <Link key={item.slug} to="/trilhas/$slug" params={{ slug: item.slug }} className="block">
                  <Card className="h-full rounded-2xl border-slate-100 bg-white p-4 shadow-[0_4px_18px_rgba(35,66,91,0.06)] transition-shadow hover:shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-[.16em] text-[#66859a]">{item.theme}</span>
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf4f6] text-[#426b86]"><Icon className="size-4.5" /></span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#1b3552]">{item.title}</h3>
                    <p className="mt-1 min-h-10 text-xs leading-relaxed text-slate-600">{item.summary}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>{item.steps} etapas</span>
                      {done > 0 ? <span className="inline-flex items-center gap-1 text-[#477b68]"><CheckCircle2 className="size-3.5" /> {done} concluídas</span> : <span className="inline-flex items-center gap-1 text-[#426b86]">Explorar <ArrowRight className="size-3.5" /></span>}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
          {visibleOthers.length === 0 && !showFeatured ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-sm text-slate-500">Nenhuma trilha encontrada. Experimente outro tema ou termo.</p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
