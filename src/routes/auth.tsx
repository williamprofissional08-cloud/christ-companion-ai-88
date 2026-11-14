import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, LockKeyhole, LogIn, UserRoundPlus, BookOpen, Mountain, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyAuthError, isAuthApiKeyError } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth")({
  ssr: false,
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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    const go = () => navigate({ to: "/inicio", replace: true });

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
      if (isAuthApiKeyError(error)) {
        // Log only diagnostic fields: never include email, password or request payloads.
        const authError = error as { name?: string; message?: string; code?: string; status?: number };
        console.error("[Auth] Supabase API key configuration error", {
          name: authError?.name,
          message: authError?.message,
          code: authError?.code,
          status: authError?.status,
        });
      }
      toast.error(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Informe o e-mail usado no cadastro.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth-callback` },
      });
      if (error) throw error;
      toast.success("Se houver um cadastro aguardando confirmação, enviaremos um novo link. Confira também o spam.");
    } catch (error) {
      if (isAuthApiKeyError(error)) {
        // Log only diagnostic fields: never include email, password or request payloads.
        const authError = error as { name?: string; message?: string; code?: string; status?: number };
        console.error("[Auth] Supabase API key configuration error", {
          name: authError?.name,
          message: authError?.message,
          code: authError?.code,
          status: authError?.status,
        });
      }
      toast.error(friendlyAuthError(error));
    } finally {
      setResending(false);
    }
  }

  async function google() {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
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
      navigate({ to: "/inicio", replace: true });
    } catch (error) {
      if (isAuthApiKeyError(error)) {
        // Log only diagnostic fields: never include email, password or request payloads.
        const authError = error as { name?: string; message?: string; code?: string; status?: number };
        console.error("[Auth] Supabase API key configuration error", {
          name: authError?.name,
          message: authError?.message,
          code: authError?.code,
          status: authError?.status,
        });
      }
      toast.error(friendlyAuthError(error));
    } finally {
      setGoogleLoading(false);
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
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#d9e9fa] text-[#092451]">
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(218,236,253,.35)_0%,rgba(255,231,183,.25)_34%,rgba(172,204,233,.75)_100%)]" />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[640px] flex-col items-center px-4 pb-6 pt-8 sm:px-8">
        <header className="mb-8 flex w-full flex-col items-center text-center">
          <div className="relative mb-1 flex flex-col items-center">
            <span aria-hidden="true" className="absolute -top-2 h-14 w-28 rounded-t-full border-t-[5px] border-[#e8ab16]" />
            <div className="relative mt-2 flex flex-col items-center text-[#0756b9]">
              <span aria-hidden="true" className="text-5xl font-bold leading-none">✝</span>
              <BookOpen aria-hidden="true" className="-mt-1 size-20 stroke-[1.7]" />
            </div>
          </div>
          <h1 className="font-serif text-[clamp(2.35rem,9vw,4rem)] font-bold leading-tight tracking-tight text-[#092451]">
            Caminho <span className="italic text-[#0766ce]">Divino</span>
          </h1>
          <div aria-hidden="true" className="mt-1 h-[3px] w-52 rounded-full bg-[#e5aa20]" />
          <p className="mt-3 text-[clamp(.78rem,3.1vw,1rem)] font-medium">Estudo · Crescimento · Comunhão · Serviço</p>
          <p className="mt-7 max-w-[330px] text-center text-[clamp(1rem,4vw,1.3rem)] italic leading-relaxed">
            Aproxime-se de Deus por meio do<br className="hidden min-[380px]:block" /> estudo da Sua Palavra.
          </p>
        </header>

        <section className="mt-auto w-full rounded-[2.6rem] border border-white/70 bg-[rgba(250,252,255,.94)] px-5 py-7 shadow-[0_18px_55px_rgba(12,54,111,.15)] backdrop-blur-md sm:px-9 sm:py-9" aria-labelledby="auth-heading">
          <h2 id="auth-heading" className="text-center text-[clamp(1.7rem,6vw,2.2rem)] font-bold">Acesse sua conta</h2>
          <p className="mb-6 mt-1 text-center text-sm text-[#687b9a] sm:text-base">Continue sua jornada no Caminho Divino.</p>

          {sent ? (
            <div className="space-y-3 rounded-2xl bg-blue-50 p-4 text-sm">
              <p>Se este endereço puder receber um novo cadastro, enviaremos um link para confirmar seu e-mail. Abra a mensagem e toque em confirmar antes de entrar. Confira também a caixa de spam ou lixo eletrônico.</p>
              <Button type="button" variant="outline" className="w-full" onClick={resendConfirmation} disabled={resending}>{resending ? "Enviando..." : "Reenviar e-mail de confirmação"}</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name" className="sr-only">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" autoComplete="name" required className="h-14 rounded-2xl border-[#c6d2e6] bg-white/60 px-5 text-base focus-visible:ring-2 focus-visible:ring-blue-600" />
                </div>
              )}
              <div className="relative">
                <Label htmlFor="email" className="sr-only">E-mail</Label>
                <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2" />
                <Input id="email" type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-14 rounded-2xl border-[#c6d2e6] bg-white/60 pl-12 pr-4 text-base focus-visible:ring-2 focus-visible:ring-blue-600" />
              </div>
              <div className="relative">
                <Label htmlFor="password" className="sr-only">Senha</Label>
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Senha" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="h-14 rounded-2xl border-[#c6d2e6] bg-white/60 pl-12 pr-12 text-base focus-visible:ring-2 focus-visible:ring-blue-600" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 focus-visible:outline-2 focus-visible:outline-blue-600" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
              </div>
              {mode === "signup" && (
                <div>
                  <Label htmlFor="confirm-password" className="sr-only">Confirme sua senha</Label>
                  <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirme sua senha" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="h-14 rounded-2xl border-[#c6d2e6] bg-white/60 px-5 text-base focus-visible:ring-2 focus-visible:ring-blue-600" />
                </div>
              )}
              <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-gradient-to-b from-[#0879e4] to-[#073c86] text-lg font-bold text-white shadow-md hover:from-[#086bd0] hover:to-[#052f70]">
                <LogIn aria-hidden="true" className="mr-2 size-5" />{loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>
          )}
          {mode === "login" && !sent && (
            <button type="button" onClick={forgot} className="mx-auto mt-4 block rounded text-sm font-medium text-[#075dcc] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-600">Esqueceu sua senha?</button>
          )}
          <div className="my-5 flex items-center gap-4 text-[#687b9a]"><span className="h-px flex-1 bg-[#c6d2e6]" /><span>Ou</span><span className="h-px flex-1 bg-[#c6d2e6]" /></div>
          <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setConfirmPassword(""); setShowPassword(false); setSent(false); }} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#0762c9] bg-white/50 px-3 text-center text-sm font-bold text-[#0750aa] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-base">
            <UserRoundPlus aria-hidden="true" className="size-5 shrink-0" />{mode === "login" ? "Criar uma nova conta" : "Já tenho conta, quero entrar"}
          </button>
          <div className="mt-7 grid grid-cols-3 divide-x divide-[#c6d2e6] text-center">
            <div className="flex flex-col items-center gap-1 px-1"><BookOpen aria-hidden="true" className="size-7 text-[#0758b8]" /><span className="text-xs leading-tight sm:text-sm">Estudos<br />Bíblicos</span></div>
            <div className="flex flex-col items-center gap-1 px-1"><Mountain aria-hidden="true" className="size-7 text-[#0758b8]" /><span className="text-xs leading-tight sm:text-sm">Trilhas<br />Guiadas</span></div>
            <div className="flex flex-col items-center gap-1 px-1"><UsersRound aria-hidden="true" className="size-7 text-[#0758b8]" /><span className="text-xs leading-tight sm:text-sm">Comunidade<br />Cristã</span></div>
          </div>
          <div className="mt-5 text-center">
            <button type="button" onClick={google} disabled={googleLoading || loading} className="text-xs text-[#315c91] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-600">{googleLoading ? "Conectando ao Google..." : "Continuar com Google"}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
