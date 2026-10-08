import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
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
    { label: "Usuários com progresso", value: stats?.usersWithProgress },
  ];

  return (
    <AppShell title="Painel Administrativo" subtitle="Escola Bíblica — gestão de conteúdo">
      <div className="space-y-5">
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

        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Cursos</h2>
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

        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Sparkles className="size-4 text-primary" /> Créditos de IA
              </h2>
              <p className="text-sm text-muted-foreground">
                O Assistente IA e o Professor IA usam os créditos de IA do aplicativo. O aluno nunca
                é cobrado.
              </p>
            </div>
            <Badge variant={ai.data?.ok ? "default" : "destructive"}>
              {ai.isFetching ? "Verificando…" : ai.data?.ok ? "IA disponível" : "IA indisponível"}
            </Badge>
          </div>

          <p className="text-sm">
            {ai.isLoading ? "Verificando o provedor de IA…" : (ai.data?.message ?? "—")}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => ai.refetch()} disabled={ai.isFetching}>
              <RefreshCw className="mr-1 size-4" /> Testar agora
            </Button>
            <Button asChild>
              <a
                href="https://lovable.dev/settings/workspace"
                target="_blank"
                rel="noopener noreferrer"
              >
                Adicionar créditos de IA <ExternalLink className="ml-1 size-4" />
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Os créditos são recarregados no workspace do aplicativo (Settings → Workspace → Usage /
            Credits). Assim que houver saldo, o Assistente e o Professor IA voltam a responder
            automaticamente, sem nenhuma outra alteração.
          </p>
        </Card>

      </div>
    </AppShell>
  );
}
