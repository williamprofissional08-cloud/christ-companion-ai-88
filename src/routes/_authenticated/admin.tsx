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
  const {
    data: isAdmin,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
    staleTime: 0,
    refetchOnMount: "always",
    retry: 2,
  });

  if (isLoading) {
    return (
      <AppShell title="Painel Administrativo" subtitle="Verificando permissões…">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Falha na verificação" subtitle="Não foi possível confirmar sua permissão">
        <Card className="flex flex-col items-start gap-3 p-6">
          <ShieldAlert className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">
            O sistema não conseguiu consultar sua permissão administrativa. Isso não significa que
            sua conta perdeu o acesso.
          </p>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Erro desconhecido ao verificar permissões."}
          </p>
          <Button size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Verificando…" : "Tentar novamente"}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/inicio">Voltar ao início</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  if (isAdmin !== true) {
    return (
      <AppShell title="Área restrita" subtitle="Acesso permitido apenas a administradores">
        <Card className="flex flex-col items-start gap-3 p-6">
          <ShieldAlert className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Sua conta autenticada não possui a função de administrador.
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
