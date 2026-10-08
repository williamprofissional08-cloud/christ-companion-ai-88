import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";
import {
  friendlyAuthError,
  rememberRedirect,
  sanitizeRedirect,
  takeRedirect,
} from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const safe = sanitizeRedirect(search['redirect']);
    return safe ? { redirect: safe } : {};
  },

  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Entrar — Caminhando com Cristo" },
      {
        name: "description",
        content: "Acesse sua conta para continuar sua jornada diária com Deus.",
      },
      { property: "og:title", content: "Entrar — Caminhando com Cristo" },
      {
        property: "og:description",
        content: "Acesse sua conta para continuar sua jornada diária com Deus.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sent, setSent] = useState(false);

  // Guarda o destino pretendido para usar depois do login (inclusive via Google).
  useEffect(() => {
    rememberRedirect(redirect ?? null);
  }, [redirect]);

  useEffect(() => {
    let active = true;
    const go = () => navigate({ to: takeRedirect(), replace: true });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) go();
      else setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (password.length < 6) {
      toast.error("Sua senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth-callback`,
            data: { full_name: name.trim(), display_name: name.trim() },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Seu cadastro foi concluído com sucesso!");
        } else {
          setSent(true);
          toast.success("Confirme seu e-mail para ativar a conta.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        // Precisa ser uma URL pública same-origin; a rota de callback conclui a sessão.
        redirect_uri: `${window.location.origin}/auth-callback`,
      });
      if (result.error) {
        toast.error(friendlyAuthError(result.error));
        return;
      }
      if (result.redirected) return;
      navigate({ to: takeRedirect(), replace: true });
    } catch (error) {
      toast.error(friendlyAuthError(error));
    }
  }

  async function forgot() {
    if (!email) {
      toast.error("Informe seu e-mail primeiro.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(friendlyAuthError(error));
    else toast.success("Enviamos um link de redefinição para seu e-mail.");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-heaven px-4">
        <div
          className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-heaven px-4 py-10">
      <Card className="w-full max-w-md animate-rise border-border/50 p-7 shadow-soft">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Caminhando com Cristo" width={64} height={64} className="size-16" />
          <h1 className="mt-3 font-display text-2xl font-semibold">Caminhando com Cristo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Bem-vindo de volta." : "Comece sua jornada hoje."}
          </p>
        </div>

        {sent ? (
          <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Enviamos um e-mail de confirmação para <strong>{email}</strong>. Clique no link para
            ativar sua conta e entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" ? (
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  autoComplete="name"
                  required
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" variant="hero" size="lg" disabled={loading}>
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" size="lg" className="w-full" onClick={google}>
          Continuar com Google
        </Button>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setSent(false);
            }}
          >
            {mode === "login" ? "Não tenho conta, quero criar" : "Já tenho conta, quero entrar"}
          </button>
          {mode === "login" ? (
            <button
              type="button"
              onClick={forgot}
              className="text-xs text-muted-foreground hover:underline"
            >
              Esqueci minha senha
            </button>
          ) : null}
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            Voltar ao início
          </Link>
        </div>
      </Card>
    </div>
  );
}
