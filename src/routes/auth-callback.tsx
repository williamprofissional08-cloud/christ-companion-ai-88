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
      { title: "Confirmação de conta — Caminho Divino" },
      { name: "description", content: "Finalizando o seu acesso com segurança." },
      { property: "og:title", content: "Confirmação de conta — Caminho Divino" },
      { property: "og:description", content: "Finalizando o seu acesso com segurança." },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

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
          const params = new URLSearchParams(window.location.search);
          const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const isSignup = params.get("flow") === "signup"
            || (params.get("type") ?? fragment.get("type")) === "signup";
          if (isSignup) {
            // Never show success until Supabase verified the authenticated user.
            // Remove one-time tokens without discarding the confirmation screen.
            window.history.replaceState(window.history.state, "", "/auth-callback");
            setConfirmed(true);
          } else {
            navigate({ to: "/inicio", replace: true });
          }
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
        {confirmed ? (
          <>
            <div aria-hidden="true" className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-blue-100 text-3xl text-blue-800">✓</div>
            <h1 className="font-display text-2xl font-semibold text-[#143b62]">Conta criada com sucesso!</h1>
            <p role="status" className="mt-3 text-sm text-muted-foreground">Seu e-mail foi confirmado. Bem-vindo ao Caminho Divino! Sua conta está pronta para começar sua jornada.</p>
            <Button className="mt-6 w-full" onClick={() => navigate({ to: "/inicio", replace: true })}>Entrar no Caminho Divino</Button>
          </>
        ) : error ? (
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
