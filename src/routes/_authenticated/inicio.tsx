import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Route as RouteIcon, Sparkles, UsersRound, Heart, NotebookPen, Headphones, ListChecks, Award, BarChart3, Bookmark, CalendarDays, ChevronRight, Clock3, Play, LayoutGrid } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getDevotional } from "@/lib/ai.functions";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { useBrazilDay } from "@/hooks/use-brazil-day";
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
  const { user } = useAuth();
  const devotionalFn = useServerFn(getDevotional);
  const fetchFavorites = useServerFn(listFavorites);
  const fetchGoals = useServerFn(listGoals);
  const favorites = useQuery({ queryKey: ["home-favorites", user?.id], queryFn: () => fetchFavorites(), enabled: !!user?.id, retry: false });
  const goals = useQuery({ queryKey: ["home-goals", user?.id], queryFn: () => fetchGoals(), enabled: !!user?.id, retry: false });
  const devotional = useQuery({
    queryKey: ["devotional", day],
    queryFn: () => loadDevotionalSafely(day, () => devotionalFn({ data: { day } })),
    retry: false,
    staleTime: Infinity,
  });

  const metadata = user?.user_metadata ?? {};
  const rawDisplayName = String(metadata["full_name"] ?? metadata["name"] ?? user?.email?.split("@")[0] ?? "Amigo");
  const displayName = rawDisplayName.trim().split(/\s+/)[0] || "Amigo";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const d = devotional.data;
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
      <div className="mx-auto w-full max-w-7xl space-y-3 pb-4 text-[#10264a] sm:space-y-4">
        <section className="relative isolate overflow-hidden rounded-3xl bg-[#143b62] px-5 py-8 text-white shadow-lg sm:px-8 sm:py-12 lg:min-h-48">
          <img src="/images/home-daily-phrase-background.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover object-center" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#092543]/95 via-[#123858]/75 to-[#153c56]/20" />
          <h1 className="text-2xl font-bold sm:text-4xl">{greeting}, {displayName}! <span aria-hidden="true">👋</span></h1>
          <blockquote className="mt-3 max-w-xl text-base leading-relaxed sm:text-xl">“A tua palavra é lâmpada para os meus pés e luz para o meu caminho.”</blockquote>
          <p className="mt-1 text-sm font-medium">Salmos 119:105</p>
        </section>

        <section aria-label="Resumo da jornada" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {summary.map((item) => (
            <Link key={item.label} to={item.to} className="flex min-h-32 min-w-0 flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-card">
              <item.icon aria-hidden="true" className={`mb-3 size-7 ${item.label === "Favoritos" ? "text-rose-600" : "text-blue-700"}`} />
              <h2 className="text-sm font-bold leading-snug sm:text-base">{item.label}</h2>
              <p className="mt-auto pt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{item.description}</p>
            </Link>
          ))}
        </section>

        <div className="grid gap-3 lg:grid-cols-2 lg:items-stretch"><section className="relative isolate overflow-hidden rounded-3xl bg-[#173b60] p-5 text-white shadow-md sm:p-8">
          <img src="/images/home-daily-phrase-background.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover object-right" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102d4a]/95 via-[#173b60]/80 to-[#173b60]/15" />
          <h2 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="size-5" aria-hidden="true" /> Devocional de Hoje</h2>
          {devotional.isLoading ? <Skeleton className="mt-5 h-16 w-2/3" /> : (
            <>
              <p className="mt-4 max-w-lg font-serif text-2xl font-bold leading-tight sm:text-3xl">{d?.verse.text?.replace(/^Síntese para meditação, não uma citação literal:\\s*/i, "") || "Medite na Palavra de Deus"}</p>
              <p className="mt-2 text-sm">{d?.verse.reference || "Salmos 119:105"}</p>
            </>
          )}
          {devotional.isError && <p role="status" className="mt-2 text-sm">Não foi possível carregar o devocional. Você pode abrir a leitura diretamente.</p>}
          <Link to="/devocional" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white px-5 font-semibold hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Ler Devocional <ChevronRight className="size-4" aria-hidden="true" /></Link>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-card sm:p-6">
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
        <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-card sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl"><LayoutGrid className="size-6 text-blue-700" aria-hidden="true" /> Acesso rápido</h2>
          <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-5">
            {shortcuts.map((item) => (
              <Link key={item.label} to={item.to} className="flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white p-3 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900">
                <item.icon aria-hidden="true" className={`size-8 ${item.to === "/favoritos" ? "text-rose-600" : "text-blue-700"}`} />
                <span className="text-xs font-semibold leading-snug sm:text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-[#e9f3ff] p-5 shadow-sm sm:p-7">
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
