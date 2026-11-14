import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: HomeRedirect,
});

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-heaven" aria-busy="true">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Carregando...</span>
      </main>
    );
  }

  return <Navigate to={isAuthenticated ? "/inicio" : "/auth"} replace />;
}
