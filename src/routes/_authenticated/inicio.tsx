import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Clock3, HeartHandshake, Route as RouteIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { useBrazilDay } from "@/hooks/use-brazil-day";
import { useBrazilDevotionalPeriod } from "@/hooks/use-brazil-devotional-period";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [
    { title: "Hoje | Caminho Divino" },
    { name: "description", content: "Seu momento diário de devocional e estudo da Palavra." },
  ] }),
  component: Inicio,
});

function Inicio() {
  const { user } = useAuth();
  const day = useBrazilDay();
  const period = useBrazilDevotionalPeriod();
  const devotional = useQuery({
    queryKey: ["devotional", day, period],
    queryFn: () => loadDevotionalSafely(day, period),
    retry: false,
    staleTime: Infinity,
  });
  const metadata = user?.user_metadata ?? {};
  const rawName = String(metadata["full_name"] ?? metadata["name"] ?? user?.email?.split("@")[0] ?? "Amigo");
  const firstName = rawName.trim().split(/\s+/)[0] || "Amigo";

  return (
    <AppShell title="Caminho Divino" homeHeader>
      <div className="mx-auto w-full max-w-3xl space-y-5 pb-6 text-slate-900 dark:text-foreground sm:space-y-6">
        <header className="px-1 pt-4 sm:pt-7">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Seu espaço de paz e reflexão</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#143b62] dark:text-blue-100 sm:text-3xl">Olá, {firstName}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Um momento com Deus pode transformar o seu dia.</p>
        </header>

        <section aria-labelledby="momento-titulo" className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-card sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 id="momento-titulo" className="font-display text-xl font-semibold text-[#143b62] dark:text-blue-100">Seu momento com Deus</h2>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">{period === "manha" ? "Manhã" : "Noite"}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Devocional de hoje</p>
          {devotional.isLoading ? <Skeleton className="mt-5 h-14 w-full rounded-xl" /> : (
            <>
              <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-[#143b62] dark:text-white sm:text-2xl">{devotional.data?.theme ?? "Medite na Palavra de Deus"}</h3>
              {devotional.data?.verse?.reference && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{devotional.data.verse.reference}</p>}
            </>
          )}
          {devotional.isError && <p role="status" className="mt-3 text-sm text-slate-600 dark:text-slate-300">A prévia está indisponível. Você ainda pode abrir o devocional.</p>}
          <div className="mt-6">
            <Link to="/devocional" search={{ periodo: period }} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#143b62] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0b2a4b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto">
              Começar devocional <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="continue-titulo" className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-card sm:p-7">
          <div className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="size-5 text-blue-700 dark:text-blue-300" />
            <h2 id="continue-titulo" className="font-display text-lg font-semibold text-[#143b62] dark:text-blue-100">Continue seu estudo</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Retome sua leitura e acompanhe o progresso na área de Estudos.</p>
          <Link to="/estudos" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-800 underline-offset-4 hover:underline focus-visible:outline-2 dark:text-blue-300">
            Abrir meus estudos <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </section>

        <section aria-labelledby="atalhos-titulo" className="px-1">
          <h2 id="atalhos-titulo" className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Explore no seu tempo</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { to: "/biblia" as const, label: "Bíblia", icon: BookOpen },
              { to: "/planos" as const, label: "Oração", icon: HeartHandshake },
              { to: "/trilhas" as const, label: "Trilhas", icon: RouteIcon },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-2 py-3 text-center text-xs font-medium text-[#143b62] shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-card dark:text-blue-100 dark:hover:bg-blue-950">
                <item.icon aria-hidden="true" className="size-5" /><span>{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
        <p className="px-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Comunidade, cursos e outros recursos continuam disponíveis no menu.
        </p>
      </div>
    </AppShell>
  );
}
