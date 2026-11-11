import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  BookMarked,
  CheckCircle2,
  CirclePlay,
  GraduationCap,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminStats } from "@/lib/admin.functions";
import { getAiStatus } from "@/lib/ai-status.functions";
import { TrackImageCatalog } from "@/components/admin/TrackImageCatalog";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Painel Administrativo — Caminhando com Cristo" },
      { name: "description", content: "Gestão de cursos, módulos e aulas da Escola Bíblica." },
      { property: "og:title", content: "Painel Administrativo" },
      { property: "og:description", content: "Administração da Escola Bíblica." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchStats = useServerFn(getAdminStats);
  const fetchAiStatus = useServerFn(getAiStatus);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
  });
  const ai = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => fetchAiStatus(),
    staleTime: 60_000,
  });

  const overviewCards = [
    { label: "Usuários ativos hoje", value: stats?.activeMembersToday, to: "/admin/alunos" as const, icon: UsersRound, tone: "blue" },
    { label: "Novos usuários na semana", value: stats?.newMembers7Days, to: "/admin/alunos" as const, icon: Users, tone: "gold" },
    { label: "Posts pendentes", value: stats?.pendingPosts, to: "/comunidade" as const, icon: CheckCircle2, tone: "blue" },
    { label: "Livros para aprovar", value: stats?.pendingBooks, to: "/comunidade" as const, icon: BookMarked, tone: "gold" },
  ];
  const contentCards = [
    { label: "Total de cursos", value: stats?.courses },
    { label: "Cursos publicados", value: stats?.coursesPublished },
    { label: "Cursos em rascunho", value: stats?.coursesDraft },
    { label: "Total de módulos", value: stats?.modules },
    { label: "Total de aulas", value: stats?.lessons },
    { label: "Conteúdos gratuitos", value: stats?.freeLessons },
    { label: "Conteúdos premium", value: stats?.premiumLessons },
    { label: "Usuários com progresso", value: stats?.usersWithProgress },
  ];
  const memberCards = [
    { label: "Contas cadastradas", value: stats?.totalMembers },
    { label: "Novos cadastros hoje", value: stats?.newMembersToday },
    { label: "Novos cadastros (7 dias)", value: stats?.newMembers7Days },
    { label: "Novos cadastros (30 dias)", value: stats?.newMembers30Days },
    { label: "Ativos hoje", value: stats?.activeMembersToday },
    { label: "Ativos (7 dias)", value: stats?.activeMembers7Days },
    { label: "Ativos (30 dias)", value: stats?.activeMembers30Days },
    { label: "Nunca acessaram", value: stats?.membersNeverActive },
    { label: "Com progresso em cursos", value: stats?.usersWithProgress },
  ];
  const quickActions = [
    { label: "Criar curso", to: "/admin/cursos" as const, icon: GraduationCap },
    { label: "Moderar comunidade", to: "/comunidade" as const, icon: Users },
    { label: "Gerenciar estudos", to: "/admin/conteudo" as const, icon: BookOpen },
    { label: "Gerenciar usuários", to: "/admin/alunos" as const, icon: UsersRound },
  ];
  const number = (value?: number) => isLoading ? "—" : (value ?? 0).toLocaleString("pt-BR");

  return (
    <AppShell title="Painel Administrativo" subtitle="Escola Bíblica — gestão de conteúdo">
      <div className="mx-auto w-full max-w-7xl space-y-7 pb-8">
        <section className="relative isolate overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-card to-amber-500/[0.08] p-5 shadow-sm sm:p-7 lg:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 -z-10 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-md shadow-primary/20"><ShieldCheck aria-hidden="true" className="size-6" /></div>
              <div className="min-w-0">
                <Badge variant="outline" className="mb-2 border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300">Área administrativa</Badge>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Paz, administrador!</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Acompanhe a atividade da plataforma e gerencie os conteúdos do Caminho Divino em um só lugar.</p>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit shrink-0 gap-1.5 rounded-full px-3 py-1.5"><ShieldCheck aria-hidden="true" className="size-3.5" /> Acesso restrito a administradores</Badge>
          </div>
        </section>

        {(stats?.pendingPosts ?? 0) + (stats?.pendingBooks ?? 0) > 0 && (
          <Link to="/comunidade" className="group flex items-center justify-between gap-4 rounded-2xl border border-destructive/25 bg-destructive/[0.06] p-4 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5">
            <div><p className="font-semibold text-destructive">Aprovações aguardando você</p><p className="mt-1 text-sm text-muted-foreground">{stats?.pendingPosts ?? 0} posts e {stats?.pendingBooks ?? 0} livros aguardando revisão</p></div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-destructive">Abrir fila <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        )}

        <section aria-labelledby="overview-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Acompanhamento</p><h2 id="overview-title" className="mt-1 font-display text-xl font-semibold">Visão geral</h2></div><p className="text-sm text-muted-foreground">Atividade e aprovações</p></div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((item) => {
              const Icon = item.icon;
              return <Link key={item.label} to={item.to} aria-label={`${item.label}: ${number(item.value)}`} className="group min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Card className="h-full rounded-2xl p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-5"><div className="flex items-start justify-between gap-3"><div className={`rounded-xl p-2.5 ${item.tone === "gold" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"}`}><Icon aria-hidden="true" className="size-5" /></div><ArrowRight aria-hidden="true" className="mt-1 size-4 text-muted-foreground opacity-60 transition group-hover:translate-x-0.5 group-hover:text-primary" /></div><p className="mt-4 font-display text-3xl font-semibold tracking-tight tabular-nums">{number(item.value)}</p><p className="mt-1 text-sm text-muted-foreground">{item.label}</p></Card></Link>;
            })}
          </div>
        </section>

        <section aria-labelledby="members-title" className="space-y-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Comunidade</p><h2 id="members-title" className="mt-1 font-display text-xl font-semibold">Usuários e crescimento</h2><p className="mt-1 text-sm text-muted-foreground">Contas registradas e atividade recente.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {memberCards.map((item) => <Card key={item.label} className="rounded-2xl p-4"><p className="min-h-9 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.label}</p><p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{number(item.value)}</p></Card>)}
          </div>
        </section>

        <section aria-labelledby="content-title" className="space-y-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Escola Bíblica</p><h2 id="content-title" className="mt-1 font-display text-xl font-semibold">Conteúdo da plataforma</h2><p className="mt-1 text-sm text-muted-foreground">Indicadores do conteúdo cadastrado no aplicativo.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {contentCards.map((item) => <Card key={item.label} className="rounded-2xl p-4"><p className="min-h-9 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.label}</p><p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{number(item.value)}</p></Card>)}
          </div>
        </section>

        <section aria-labelledby="quick-actions-title" className="space-y-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Acesso rápido</p><h2 id="quick-actions-title" className="mt-1 font-display text-xl font-semibold">Atalhos administrativos</h2><p className="mt-1 text-sm text-muted-foreground">Ferramentas disponíveis para o seu dia a dia.</p></div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(({ label, to, icon: Icon }, index) => <Button key={label} asChild variant={index === 0 ? "default" : "outline"} className={`h-auto min-h-14 justify-start gap-3 whitespace-normal rounded-2xl px-4 py-3 ${index === 0 ? "shadow-sm" : "bg-card"}`}><Link to={to}><span className={`rounded-lg p-2 ${index === 0 ? "bg-primary-foreground/15" : "bg-primary/10 text-primary"}`}><Icon aria-hidden="true" className="size-4" /></span><span>{label}</span><ArrowRight aria-hidden="true" className="ml-auto size-4 opacity-60" /></Link></Button>)}
          </div>
        </section>

        <section aria-labelledby="management-title" className="space-y-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ferramentas</p><h2 id="management-title" className="mt-1 font-display text-xl font-semibold">Gestão do aplicativo</h2><p className="mt-1 text-sm text-muted-foreground">Acesse as ferramentas administrativas disponíveis.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ManagementCard icon={GraduationCap} title="Cursos, módulos e aulas" description="Criar, editar, publicar, arquivar e organizar cursos, módulos e aulas." to="/admin/cursos" action="Gerenciar cursos" />
            <ManagementCard icon={BookOpen} title="Estudos e planos de oração" description="Editar títulos, referências, categorias, resumos, conteúdo dos estudos e publicar versões revisadas." to="/admin/conteudo" action="Gerenciar biblioteca" />
            <ManagementCard icon={Users} title="Comunidade" description="Moderar primeiras publicações e livros indicados pela comunidade." to="/comunidade" action="Abrir moderação" />
            <ManagementCard icon={UsersRound} title="Alunos e membros" description="Consulte contas, cadastro e atividade dos membros." to="/admin/alunos" action="Ver membros" />
          </div>
        </section>

        <TrackImageCatalog />

        <Card className="space-y-4 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-start gap-3"><span className="rounded-xl bg-amber-500/15 p-2.5 text-amber-700 dark:text-amber-300"><Sparkles aria-hidden="true" className="size-5" /></span><div><h2 className="font-display text-lg font-semibold">Diagnóstico da IA</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">O Assistente IA e o Professor IA utilizam o Gemini por meio do Supabase. O aluno nunca é cobrado.</p></div></div><Badge variant={ai.data?.ok ? "default" : "destructive"} className="rounded-full px-3">{ai.isFetching ? "Verificando…" : ai.data?.ok ? "Gemini disponível" : "Gemini indisponível"}</Badge></div>
          <p role="status" aria-live="polite" className="rounded-xl bg-muted/60 p-3 text-sm">{ai.isLoading ? "Verificando o provedor de IA…" : (ai.data?.message ?? "—")}</p>
          <Button variant="outline" onClick={() => ai.refetch()} disabled={ai.isFetching} className="rounded-xl"><RefreshCw aria-hidden="true" className={`mr-2 size-4 ${ai.isFetching ? "animate-spin" : ""}`} /> Testar agora</Button>
          <p className="text-xs leading-relaxed text-muted-foreground">O teste consulta diretamente a mesma função Gemini utilizada pelas duas IAs. Se houver falha, o diagnóstico exibirá o código e a mensagem retornados pelo provedor, sem sugerir a compra de créditos da Lovable.</p>
        </Card>
      </div>
    </AppShell>
  );
}

type ManagementCardProps = {
  icon: typeof GraduationCap;
  title: string;
  description: string;
  to: "/admin/cursos" | "/admin/conteudo" | "/comunidade" | "/admin/alunos";
  action: string;
};

function ManagementCard({ icon: Icon, title, description, to, action }: ManagementCardProps) {
  return <Card className="flex h-full flex-col justify-between gap-5 rounded-2xl p-5 transition-shadow hover:shadow-md sm:p-6"><div><span className="inline-flex rounded-xl bg-primary/10 p-2.5 text-primary"><Icon aria-hidden="true" className="size-5" /></span><h3 className="mt-4 font-display text-lg font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div><Button asChild variant="outline" className="w-full justify-between rounded-xl sm:w-fit"><Link to={to}>{action}<ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link></Button></Card>;
}
