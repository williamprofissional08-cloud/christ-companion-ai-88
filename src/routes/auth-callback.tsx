import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { friendlyAuthError, takeRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Concluindo login — Caminhando com Cristo" },
      { name: "description", content: "Finalizando o seu acesso com segurança." },
      { property: "og:title", content: "Concluindo login — Caminhando com Cristo" },
      { property: "og:description", content: "Finalizando o seu acesso com segurança." },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const oauthError = params.get("error_description") ?? params.get("error") ?? hash.get("error");
    if (oauthError) {
      setError(friendlyAuthError(oauthError));
      return;
    }

    const finish = () => {
      if (done) return;
      done = true;
      // `replace` remove os parâmetros do OAuth da URL final.
      navigate({ to: takeRedirect(), replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });

    const timeout = window.setTimeout(() => {
      if (!done) setError("Não foi possível concluir o login. Tente novamente.");
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-heaven px-4">
      <Card className="w-full max-w-sm p-7 text-center shadow-soft">
        {error ? (
          <>
            <h1 className="font-display text-xl font-semibold">Login não concluído</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button
              className="mt-5 w-full"
              variant="hero"
              onClick={() => navigate({ to: "/auth", replace: true })}
            >
              Tentar novamente
            </Button>
          </>
        ) : (
          <>
            <div
              className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden
            />
            <p className="mt-4 text-sm text-muted-foreground">Concluindo seu login...</p>
          </>
        )}
      </Card>
    </main>
  );
}
