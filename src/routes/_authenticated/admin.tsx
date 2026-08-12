import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { amIAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const checkAdmin = useServerFn(amIAdmin);
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <AppShell title="Painel Administrativo" subtitle="Verificando permissões…">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Área restrita" subtitle="Acesso permitido apenas a administradores">
        <Card className="flex flex-col items-start gap-3 p-6">
          <ShieldAlert className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <Button asChild size="sm">
            <Link to="/inicio">Voltar ao início</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  return <Outlet />;
}
