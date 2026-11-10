import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    // Never trust a persisted session until Supabase validates the user.
    // After signing-key rotation, an old JWT can remain in localStorage and
    // make the protected route bounce back to this page forever.
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;
        if (!error && data.user) {
          go();
          return;
        }

        // Clear only this browser's invalid session; do not revoke other devices.
        const { data: stored } = await supabase.auth.getSession();
        if (stored.session) {
          await supabase.auth.signOut({ scope: "local" });
        }
      } catch {
        // Keep the login form available if session validation is temporarily unavailable.
      } finally {
        if (active) setChecking(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") go();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (mode === "signup" && !name.trim()) {
      toast.error("Informe seu nome para criar a conta.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      toast.error("As senhas não conferem. Digite exatamente a mesma senha nos dois campos.");
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
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth-callback`,
            data: { full_name: name.trim(), display_name: name.trim() },
          },
        });
        if (error) throw error;
        // When Supabase email obfuscation is enabled, an existing address can
        // return a user with no identities. Keep the response indistinguishable
        // from a normal confirmation-required signup to prevent account enumeration.
        if (data.session) {
          toast.success("Seu cadastro foi concluído com sucesso!");
        } else if (data.user) {
          setSent(true);
          toast.success("Se o cadastro puder ser realizado, você receberá as instruções por e-mail.");
        } else {
          throw new Error("Não recebemos a confirmação do cadastro. Tente novamente.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
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
            Se este endereço puder receber um novo cadastro, você receberá um e-mail com as
            instruções para ativar sua conta. Verifique também a caixa de spam.
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="pr-12"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres. Pode usar somente números ou letras minúsculas; não exigimos maiúsculas nem símbolos.</p>
              {mode === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirme sua senha</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              )}
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
              setConfirmPassword("");
              setShowPassword(false);
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
