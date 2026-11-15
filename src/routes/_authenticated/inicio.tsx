import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, Bookmark, CalendarDays, ChevronRight, Clock3,
  GraduationCap, Heart, MessageCircleHeart, NotebookPen, Route as RouteIcon,
  Sparkles, UsersRound, BookMarked, Compass,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { useBrazilDay } from "@/hooks/use-brazil-day";
import { getLatestStudyCheckpoint } from "@/lib/study-progress.functions";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Hoje | Caminho Divino" },
      { name: "description", content: "Seu momento diário com a Palavra de Deus." },
      { property: "og:title", content: "Caminho Divino" },
    ],
  }),
  component: Inicio,
});

const OTHER_PATHS = [
  { to: "/trilhas", label: "Trilhas guiadas", icon: RouteIcon },
  { to: "/escola", label: "Escola Bíblica", icon: GraduationCap },
  { to: "/biblia", label: "Ler a Bíblia", icon: BookMarked },
  { to: "/assistente", label: "Professor IA", icon: MessageCircleHeart },
  { to: "/metas", label: "Minha jornada", icon: Compass },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/diario", label: "Minhas anotações", icon: NotebookPen },
] as const;

function Inicio() {
  const day = useBrazilDay();
  const { user } = useAuth();
  const fetchLatestStudy = useServerFn(getLatestStudyCheckpoint);

  const devotional = useQuery({
    queryKey: ["devotional", day],
    queryFn: () => loadDevotionalSafely(day),
    retry: false,
    staleTime: Infinity,
  });
  const recentStudy = useQuery({
    queryKey: ["home-recent-study", user?.id],
    queryFn: () => fetchLatestStudy(),
    enabled: Boolean(user?.id),
    retry: false,
    staleTime: 60_000,
  });

  const metadata = user?.user_metadata ?? {};
  const rawName = String(metadata["full_name"] ?? metadata["name"] ?? user?.email?.split("@")[0] ?? "Amigo");
  const firstName = rawName.trim().split(/\s+/)[0] || "Amigo";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const verseText = devotional.data?.verse.text?.replace(/^Síntese para meditação, não uma citação literal:\s*/i, "").trim();
  const isSynthesis = Boolean(devotional.data?.verse.text?.startsWith("Síntese para meditação"));
  const recent = recentStudy.data;

  return (
    <AppShell title="Caminho Divino" homeHeader>
      <div className="home-dash mx-auto max-w-5xl text-foreground">
        <header className="px-1 pt-1 sm:pt-3">
          <p className="text-sm font-medium text-muted-foreground">{greeting}, {firstName}!</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#143b62] dark:text-blue-100 sm:text-3xl">
            Que a Palavra guie o seu dia.
          </h1>
        </header>

        <section aria-labelledby="daily-heading" className="relative isolate overflow-hidden rounded-3xl bg-[#123b67] p-5 text-white shadow-md sm:p-8">
          <img
            src="/images/home-daily-phrase-background.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 size-full object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#082644]/95 via-[#123b62]/90 to-[#123b62]/65" />
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-100">
              <CalendarDays aria-hidden="true" className="size-4" />
              DEVOCIONAL DE HOJE · NOVO ÀS 00H
            </p>
            <h2 id="daily-heading" className="mt-4 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              {devotional.isLoading ? "Um momento com Deus, todos os dias" : isSynthesis ? "Uma reflexão para hoje" : "Uma palavra para hoje"}
            </h2>
            {devotional.isLoading ? (
              <Skeleton className="mt-4 h-14 max-w-sm bg-white/20" />
            ) : (
              <>
                <p className="mt-3 line-clamp-4 max-w-xl font-serif text-base leading-relaxed text-blue-50 sm:text-lg">
                  {verseText || "Separe alguns minutos para ler, refletir e orar."}
                </p>
                {devotional.data?.verse.reference ? (
                  <p className="mt-3 text-sm font-medium text-blue-100">{devotional.data.verse.reference}</p>
                ) : null}
              </>
            )}
            {devotional.isError ? (
              <p role="status" className="mt-2 text-sm text-blue-100">
                Não foi possível carregar a prévia. A leitura completa continua acessível.
              </p>
            ) : null}
            <Link
              to="/devocional"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#123b67] shadow-sm transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ler devocional completo <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="continue-heading" className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="size-5 text-primary" />
            <h2 id="continue-heading" className="font-display text-lg font-semibold sm:text-xl">
              Continue sua caminhada
            </h2>
          </div>
          {recentStudy.isLoading ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : recent ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blue-50/70 p-4 dark:bg-blue-950/30">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#123b67] dark:text-blue-100">{recent.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{recent.reference || "Estudo bíblico"}</p>
                <p className="mt-2 text-xs text-muted-foreground">Leitura registrada: {recent.readPercent}%</p>
              </div>
              <Link
                to="/estudos/$slug"
                params={{ slug: recent.slug }}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#123b67] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0e2d4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Retomar estudo <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                {recentStudy.isError ? "Não conseguimos consultar sua última leitura agora. Seus estudos continuam disponíveis." : "Comece um estudo bíblico. Seu progresso será salvo para você retomar depois."}
              </p>
              <Link to="/estudos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
                Escolher estudo <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          )}
        </section>

        <section aria-label="Caminhos principais" className="grid gap-3 sm:grid-cols-2">
          <Link to="/estudos" className="group flex min-h-28 items-center gap-4 rounded-2xl border border-blue-100 bg-card p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-700">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"><BookOpen aria-hidden="true" className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-base font-semibold">Estudar a Bíblia</strong>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">Capítulos, explicações e aplicações profundas.</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/comunidade" className="group flex min-h-28 items-center gap-4 rounded-2xl border border-blue-100 bg-card p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-700">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"><UsersRound aria-hidden="true" className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-base font-semibold">Sua comunidade</strong>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">Converse, compartilhe e faça amizades.</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        <details className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary">
            <span className="flex items-center gap-2"><Sparkles aria-hidden="true" className="size-5 text-primary" /> Explorar mais ferramentas</span>
            <ChevronRight aria-hidden="true" className="size-5 transition-transform group-open:rotate-90" />
          </summary>
          <nav aria-label="Outras ferramentas" className="mt-3 grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2">
            {OTHER_PATHS.map((item) => (
              <Link key={item.to} to={item.to} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
                <item.icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </AppShell>
  );
}
