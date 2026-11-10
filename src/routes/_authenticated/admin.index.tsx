import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, GraduationCap, RefreshCw, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminStats } from "@/lib/admin.functions";
import { getAiStatus } from "@/lib/ai-status.functions";


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


  const cards = [
    { label: "Total de cursos", value: stats?.courses },
    { label: "Cursos publicados", value: stats?.coursesPublished },
    { label: "Cursos em rascunho", value: stats?.coursesDraft },
    { label: "Total de módulos", value: stats?.modules },
    { label: "Total de aulas", value: stats?.lessons },
    { label: "Conteúdos gratuitos", value: stats?.freeLessons },
    { label: "Conteúdos premium", value: stats?.premiumLessons },
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

  return (
    <AppShell title="Painel Administrativo" subtitle="Escola Bíblica — gestão de conteúdo">
      <div className="space-y-5">
        <Card className="flex flex-col gap-3 border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><ShieldCheck className="size-5" /></div>
            <div>
              <h2 className="font-display text-lg font-semibold">Central de administração</h2>
              <p className="text-sm text-muted-foreground">Gerencie a Escola Bíblica, os estudos e os conteúdos do Caminho Divino em um só lugar.</p>
            </div>
          </div>
          <Badge variant="outline">Acesso restrito a administradores</Badge>
        </Card>

        <section className="space-y-3">
          <div><h2 className="font-display text-base font-semibold">Usuários e crescimento</h2><p className="text-xs text-muted-foreground">Contas registradas e atividade recente. Os totais consideram os perfis existentes no aplicativo.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {memberCards.map((card) => (
              <Card key={card.label} className="p-4">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{isLoading ? "—" : (card.value ?? 0).toLocaleString("pt-BR")}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div><h2 className="font-display text-base font-semibold">Visão geral</h2><p className="text-xs text-muted-foreground">Indicadores do conteúdo cadastrado no aplicativo</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label} className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {isLoading ? "—" : (card.value ?? 0)}
              </p>
            </Card>
          ))}
          </div>
        </section>

        <section className="space-y-3">
          <div><h2 className="font-display text-base font-semibold">Gestão do aplicativo</h2><p className="text-xs text-muted-foreground">Acesse as ferramentas administrativas disponíveis</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><GraduationCap className="size-5 text-primary" /> Cursos, módulos e aulas</h2>
            <p className="text-sm text-muted-foreground">
              Criar, editar, publicar, arquivar e organizar cursos, módulos e aulas.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/cursos">
              Gerenciar cursos <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><BookOpen className="size-5 text-primary" /> Estudos e planos de oração</h2>
            <p className="text-sm text-muted-foreground">
              Editar títulos, referências, categorias, resumos, conteúdo dos estudos e publicar versões revisadas.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/conteudo">
              Gerenciar biblioteca <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </Card>

          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Users className="size-5 text-primary" /> Alunos e membros</h2><p className="text-sm text-muted-foreground">Consulte contas, cadastro e atividade dos membros.</p></div>
            <Button asChild><Link to="/admin/alunos">Ver membros <ArrowRight className="ml-1 size-4" /></Link></Button>
          </Card>
          </div>
        </section>

        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Sparkles className="size-4 text-primary" /> Diagnóstico da IA
              </h2>
              <p className="text-sm text-muted-foreground">
                O Assistente IA e o Professor IA utilizam o Gemini por meio do Supabase. O aluno nunca é cobrado.
              </p>
            </div>
            <Badge variant={ai.data?.ok ? "default" : "destructive"}>
              {ai.isFetching ? "Verificando…" : ai.data?.ok ? "Gemini disponível" : "Gemini indisponível"}
            </Badge>
          </div>

          <p className="text-sm">
            {ai.isLoading ? "Verificando o provedor de IA…" : (ai.data?.message ?? "—")}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => ai.refetch()} disabled={ai.isFetching}>
              <RefreshCw className="mr-1 size-4" /> Testar agora
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            O teste consulta diretamente a mesma função Gemini utilizada pelas duas IAs. Se houver
            falha, o diagnóstico exibirá o código e a mensagem retornados pelo provedor, sem sugerir
            a compra de créditos da Lovable.
          </p>
        </Card>

      </div>
    </AppShell>
  );
}
