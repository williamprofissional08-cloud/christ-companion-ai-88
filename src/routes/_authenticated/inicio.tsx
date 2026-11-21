import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Route as RouteIcon, Sparkles, UsersRound, Heart, NotebookPen, Headphones, ListChecks, Award, BarChart3, Bookmark, CalendarDays, ChevronRight, Clock3, Play, LayoutGrid, Sun, Moon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { useBrazilDay } from "@/hooks/use-brazil-day";
import { useBrazilDevotionalPeriod } from "@/hooks/use-brazil-devotional-period";
import { listFavorites, listGoals } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | Caminho Divino" },
      { name: "description", content: "Sua jornada diária com a Palavra de Deus." },
      { property: "og:title", content: "Caminho Divino" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const day = useBrazilDay();
  const suggestedDevotionalPeriod = useBrazilDevotionalPeriod();
  const { user } = useAuth();
  const fetchFavorites = useServerFn(listFavorites);
  const fetchGoals = useServerFn(listGoals);
  const favorites = useQuery({ queryKey: ["home-favorites", user?.id], queryFn: () => fetchFavorites(), enabled: !!user?.id, retry: false });
  const goals = useQuery({ queryKey: ["home-goals", user?.id], queryFn: () => fetchGoals(), enabled: !!user?.id, retry: false });
  const morningDevotional = useQuery({
    queryKey: ["devotional", day, "manha"],
    queryFn: () => loadDevotionalSafely(day, "manha"),
    retry: false,
    staleTime: Infinity,
  });
  const eveningDevotional = useQuery({
    queryKey: ["devotional", day, "noite"],
    queryFn: () => loadDevotionalSafely(day, "noite"),
    retry: false,
    staleTime: Infinity,
  });

  const metadata = user?.user_metadata ?? {};
  const rawDisplayName = String(metadata["full_name"] ?? metadata["name"] ?? user?.email?.split("@")[0] ?? "Amigo");
  const displayName = rawDisplayName.trim().split(/\s+/)[0] || "Amigo";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const shortcuts = [
    { to: "/estudos", label: "Estudar a Bíblia", icon: BookOpen },
    { to: "/trilhas", label: "Cursos e Trilhas", icon: RouteIcon },
    { to: "/escola", label: "Escola Bíblica", icon: GraduationCap },
    { to: "/assistente", label: "Professor IA (Assistente)", icon: Sparkles },
    { to: "/comunidade", label: "Comunidade (Chat)", icon: UsersRound },
    { to: "/favoritos", label: "Meus Favoritos", icon: Heart },
    { to: "/diario", label: "Minhas Anotações", icon: NotebookPen },
    { to: "/estudos", label: "Estudos com áudio", icon: Headphones },
    { to: "/planos", label: "Planos de oração", icon: ListChecks },
    { to: "/escola", label: "Escola e certificados", icon: Award },
  ] as const;
  const summary = [
    { label: "Minha Jornada Bíblica", icon: BookOpen, to: "/metas", description: goals.isLoading ? "Carregando..." : goals.isError ? "Indisponível" : `${goals.data?.filter((goal) => goal.completed).length ?? 0} de ${goals.data?.length ?? 0} metas concluídas` },
    { label: "Estudos Concluídos", icon: BarChart3, to: "/estudos", description: "Ver meus estudos" },
    { label: "Favoritos", icon: Heart, to: "/favoritos", description: favorites.isLoading ? "Carregando..." : favorites.isError ? "Indisponível" : `${favorites.data?.length ?? 0} itens salvos` },
    { label: "Minhas Pregações", icon: Bookmark, to: "/minhas-mensagens", description: "Minhas mensagens" },
  ] as const;

  return (
    <AppShell title="Caminho Divino" homeHeader>
      <div className="home-dash mx-auto w-full max-w-none text-[#10264a]">
        <section className="home-hero relative isolate overflow-hidden rounded-3xl bg-[#143b62] px-5 py-8 text-white shadow-lg sm:px-8 sm:py-12">
          <img src="/images/home-daily-phrase-background.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover object-center" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#092543]/95 via-[#123858]/75 to-[#153c56]/20" />
          <h1 className="text-2xl font-bold sm:text-4xl">{greeting}, {displayName}! <span aria-hidden="true">👋</span></h1>
          <blockquote className="mt-3 max-w-xl text-base leading-relaxed sm:text-xl">“A tua palavra é lâmpada para os meus pés e luz para o meu caminho.”</blockquote>
          <p className="mt-1 text-sm font-medium">Salmos 119:105</p>
        </section>

        <section aria-label="Resumo da jornada" className="home-summary grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {summary.map((item) => (
            <Link key={item.label} to={item.to} className="home-stat flex min-h-0 min-w-0 flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-card">
              <item.icon aria-hidden="true" className={`mb-3 size-7 ${item.label === "Favoritos" ? "text-rose-600" : "text-blue-700"}`} />
              <h2 className="text-sm font-bold leading-snug sm:text-base">{item.label}</h2>
              <p className="mt-auto pt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{item.description}</p>
            </Link>
          ))}
        </section>

        <div className="home-middle grid gap-3 lg:grid-cols-2 lg:items-stretch"><section className="home-devotional rounded-3xl border border-blue-100 bg-white p-4 text-[#102d4a] shadow-md dark:border-slate-700 dark:bg-card dark:text-foreground sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold sm:text-xl"><CalendarDays className="size-5 text-primary" aria-hidden="true" /> Devocionais de Hoje</h2>
            <span className="text-xs font-semibold text-primary">Novos às 00h</span>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Dois momentos completos com Deus. Horários recomendados: 6h e 20h (Brasília).</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { period: "manha" as const, label: "Devocional da Manhã", hour: "6h", icon: Sun, image: "/images/prayer-sunrise.webp", query: morningDevotional },
              { period: "noite" as const, label: "Devocional da Noite", hour: "20h", icon: Moon, image: "/images/devotional-reflection.webp", query: eveningDevotional },
            ]).map((entry) => (
              <div key={entry.period} className="relative isolate flex min-h-44 flex-col overflow-hidden rounded-2xl bg-[#123b60] p-4 text-white shadow-sm sm:min-h-56 sm:p-5">
                <img src={entry.image} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d2946]/95 via-[#163d5b]/85 to-[#153c56]/50" />
                <p className="flex items-center gap-2 text-xs font-semibold"><entry.icon className="size-4" aria-hidden="true" /> {entry.label} · {entry.hour}</p>
                {suggestedDevotionalPeriod === entry.period ? <span className="mt-2 self-start rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">Leitura sugerida agora</span> : null}
                {entry.query.isLoading ? <Skeleton className="mt-4 h-10 w-full" /> : (
                  <p className="mt-3 line-clamp-3 flex-1 font-display text-base font-bold leading-snug sm:text-lg">{entry.query.data?.theme ?? "Medite na Palavra de Deus"}</p>
                )}
                <p className="mt-2 text-xs text-blue-100">{entry.query.data?.verse.reference ?? ""}</p>
                {entry.query.isError ? <p className="mt-1 text-xs">Não foi possível carregar a prévia. Abra a leitura completa.</p> : null}
                <Link to="/devocional" search={{ periodo: entry.period }} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-full border border-white px-4 text-xs font-bold transition-colors hover:bg-white/20">
                  Ler completo <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="home-continue rounded-3xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl"><Clock3 aria-hidden="true" className="size-6 text-blue-700" /> Continuar de onde parou</h2>
            <Link to="/estudos" className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline">Ver tudo</Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-slate-700 dark:bg-slate-900">
            <div><p className="font-semibold">Sua jornada bíblica</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Acesse seus estudos e continue sua leitura.</p></div>
            <Link to="/estudos" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-700 px-5 font-semibold text-blue-700 hover:bg-blue-100 dark:text-blue-300"><Play className="size-4" aria-hidden="true" /> Continuar</Link>
          </div>
        </section>

        </div>
        <section className="home-access rounded-3xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-card sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl"><LayoutGrid className="size-6 text-blue-700" aria-hidden="true" /> Acesso rápido</h2>
          <div className="home-shortcuts grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-5">
            {shortcuts.map((item) => (
              <Link key={item.label} to={item.to} className="home-shortcut flex min-h-0 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white p-3 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900">
                <item.icon aria-hidden="true" className={`size-8 ${item.to === "/favoritos" ? "text-rose-600" : "text-blue-700"}`} />
                <span className="text-xs font-semibold leading-snug sm:text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-course relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-[#e9f3ff] p-5 shadow-sm sm:p-7">
          <img src="/images/home-daily-phrase-background.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover object-center opacity-40" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/85 to-white/40" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="font-serif text-xl font-bold sm:text-2xl">Formação de Pregadores<br />Gênesis ao Apocalipse</h2><p className="mt-2 text-sm">Um seminário bíblico completo, livro por livro.</p></div>
            <Link to="/escola" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#123b69] px-5 font-semibold text-white hover:bg-[#0c2c51]">Acessar Curso <ChevronRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
