import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { friendlyAuthError } from "@/lib/auth-redirect";
import { finishAuthCallback } from "@/lib/auth-callback-flow";

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    let disposed = false;
    // A slow server should offer a safe way back to sign-in, not claim that
    // registration failed or erase a verified user's existing session.
    const timeout = window.setTimeout(() => {
      if (!disposed) setError("A confirmação está demorando. Você pode voltar para a tela de login e entrar com o e-mail e a senha que cadastrou.");
    }, 20_000);

    void finishAuthCallback(supabase.auth, window.location.search, window.location.hash)
      .then((outcome) => {
        if (disposed) return;
        window.clearTimeout(timeout);
        if (outcome === "authenticated") {
          // Remove one-time credentials from browser history via replace.
          navigate({ to: "/inicio", replace: true });
          return;
        }
        setError("Não há uma sessão ativa neste navegador. Se o e-mail já foi confirmado, entre com seu e-mail e senha. Não é necessário criar outra conta.");
      })
      .catch((issue: unknown) => {
        if (disposed) return;
        window.clearTimeout(timeout);
        setError(friendlyAuthError(issue));
      });

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-heaven px-4">
      <Card className="w-full max-w-sm p-7 text-center shadow-soft">
        {error ? (
          <>
            <h1 className="font-display text-xl font-semibold">Confirmação de acesso</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button
              className="mt-5 w-full"
              variant="hero"
              onClick={() => navigate({ to: "/auth", replace: true })}
            >
              Voltar para entrar
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
