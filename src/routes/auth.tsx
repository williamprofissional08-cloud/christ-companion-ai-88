import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, LockKeyhole, LogIn, UserRoundPlus, BookOpen, Mountain, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseDiagnostics, supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { friendlyAuthError, getAuthEmailRedirectUrl, isAuthApiKeyError } from "@/lib/auth-redirect";
import { checkExistingAccountSession } from "@/lib/auth-flow";

function logAuthApiKeyError(error: unknown): void {
  if (!isAuthApiKeyError(error)) return;
  // Log only diagnostic fields: never include email, password or request payloads.
  const authError = error as { name?: string; message?: string; code?: string; status?: number };
  console.error("[Auth] Supabase API key configuration error", {
    ...getSupabaseDiagnostics(),
    name: authError?.name,
    message: authError?.message,
    code: authError?.code,
    status: authError?.status,
  });
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Entrar — Caminho Divino" },
      {
        name: "description",
        content: "Acesse sua conta para continuar sua jornada diária com Deus.",
      },
      { property: "og:title", content: "Entrar — Caminho Divino" },
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
  const [recovering, setRecovering] = useState(false);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sent, setSent] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  useEffect(() => {
    let active = true;

    // A failed user check may be a temporary network/Auth outage, not a missing
    // account. Never erase a persisted session just because verification fails.
    void checkExistingAccountSession(() => supabase.auth.getUser())
      .then((status) => {
        if (!active) return;
        if (status === "authenticated") {
          navigate({ to: "/inicio", replace: true });
          return;
        }
        setSessionUnavailable(status === "unavailable");
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
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
    setConfirmationRequired(false);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${getAuthEmailRedirectUrl("/auth-callback")}?flow=signup`,
            data: { full_name: name.trim(), display_name: name.trim() },
          },
        });
        if (error) throw error;
        // When Supabase email obfuscation is enabled, an existing address can
        // return a user with no identities. Keep the response indistinguishable
        // from a normal confirmation-required signup to prevent account enumeration.
        if (data.session) {
          toast.success("Seu cadastro foi concluído com sucesso!");
          navigate({ to: "/inicio", replace: true });
        } else if (data.user) {
          setSent(true);
          toast.success("Confira as orientações de acesso. Se este for um novo cadastro, poderá chegar um e-mail de confirmação.");
        } else {
          throw new Error("Não recebemos a confirmação do cadastro. Tente novamente.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        if (!data.session || !data.user) throw new Error("Não foi possível iniciar a sessão. Tente entrar novamente.");
        navigate({ to: "/inicio", replace: true });
      }
    } catch (error) {
      logAuthApiKeyError(error);
      const failure = error as { code?: unknown; message?: unknown };
      const reason = `${typeof failure?.code === "string" ? failure.code : ""} ${typeof failure?.message === "string" ? failure.message : ""}`.toLowerCase();
      if (mode === "login" && /email[_ ]not[_ ]confirmed/.test(reason)) setConfirmationRequired(true);
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
        options: { emailRedirectTo: `${getAuthEmailRedirectUrl("/auth-callback")}?flow=signup` },
      });
      if (error) throw error;
      toast.success("Se houver um cadastro aguardando confirmação, enviaremos um novo link. Confira também o spam.");
    } catch (error) {
      logAuthApiKeyError(error);
      toast.error(friendlyAuthError(error));
    } finally {
      setResending(false);
    }
  }

  async function google() {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    try {
      // Use the same Supabase project as email/password accounts.
      // The previous Lovable session broker could return credentials from a
      // different backend and leave users unable to access protected routes.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthEmailRedirectUrl("/auth-callback"),
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Não foi possível iniciar o acesso com Google. Tente novamente.");
      window.location.assign(data.url);
    } catch (error) {
      logAuthApiKeyError(error);
      toast.error(friendlyAuthError(error));
      setGoogleLoading(false);
    }
  }

  async function forgot() {
    if (recovering) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Informe um e-mail válido para recuperar o acesso.");
      return;
    }
    setRecovering(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: getAuthEmailRedirectUrl("/reset-password"),
      });
      if (error) throw error;
      // Do not expose whether an account exists for this email address.
      toast.success("Se houver uma conta para este e-mail, enviaremos instruções para recuperar o acesso. Confira também o spam.");
    } catch (error) {
      logAuthApiKeyError(error);
      toast.error(friendlyAuthError(error));
    } finally {
      setRecovering(false);
    }
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
      <img
        src="/images/prayer-sunrise.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[60%_center]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(230,241,254,.70)_0%,rgba(230,242,253,.32)_38%,rgba(212,231,249,.72)_100%)]"
      />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[640px] flex-col items-center px-4 pb-6 pt-6 sm:px-8 sm:pt-8">
        <header className="mb-7 flex w-full flex-col items-center text-center">
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            width={128}
            height={128}
            className="mb-2 h-24 w-24 object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,.9)] sm:h-28 sm:w-28"
          />
          <h1 className="font-serif text-[clamp(2.35rem,9vw,4rem)] font-bold leading-tight tracking-tight text-[#092451] drop-shadow-[0_1px_3px_rgba(255,255,255,.9)]">
            Caminho <span className="italic text-[#0766ce]">Divino</span>
          </h1>
          <div aria-hidden="true" className="mt-1 h-[3px] w-52 rounded-full bg-[#e5aa20]" />
          <p className="mt-3 text-[clamp(.78rem,3.1vw,1rem)] font-medium">Estudo · Crescimento · Comunhão · Serviço</p>
          <p className="mt-6 max-w-[330px] text-center text-[clamp(1rem,4vw,1.3rem)] italic leading-relaxed">
            Aproxime-se de Deus por meio do<br className="hidden min-[380px]:block" /> estudo da Sua Palavra.
          </p>
        </header>

        <section className="mt-auto w-full rounded-[2.6rem] border border-white/70 bg-[rgba(250,252,255,.94)] px-5 py-7 shadow-[0_18px_55px_rgba(12,54,111,.15)] backdrop-blur-md sm:px-9 sm:py-9" aria-labelledby="auth-heading">
          <h2 id="auth-heading" className="text-center text-[clamp(1.7rem,6vw,2.2rem)] font-bold">Acesse sua conta</h2>
          <p className="mb-6 mt-1 text-center text-sm text-[#687b9a] sm:text-base">Continue sua jornada no Caminho Divino.</p>
          {sessionUnavailable && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Não conseguimos verificar sua sessão agora. Sua conta não foi apagada. Você pode tentar entrar novamente ou recuperar seu acesso.</p>}

          {sent ? (
            <div className="space-y-3 rounded-2xl bg-blue-50 p-4 text-sm">
              <p>Se este for um novo cadastro, confira seu e-mail (inclusive spam) para confirmar a conta. Se você já se cadastrou, entre com sua senha ou recupere o acesso. Por segurança, não informamos nesta tela se um endereço já estava cadastrado.</p>
              <Button type="button" className="w-full" onClick={() => { setSent(false); setMode("login"); setPassword(""); setConfirmPassword(""); }}>Já tenho uma conta — entrar</Button>
              <Button type="button" variant="outline" className="w-full" onClick={forgot} disabled={recovering}>{recovering ? "Solicitando..." : "Esqueci minha senha"}</Button>
              <Button type="button" variant="outline" className="w-full" onClick={resendConfirmation} disabled={resending}>{resending ? "Enviando..." : "Reenviar confirmação"}</Button>
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
                <Input id="email" type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="h-14 rounded-2xl border-[#c6d2e6] bg-white/60 pl-12 pr-4 text-base focus-visible:ring-2 focus-visible:ring-blue-600" />
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
            <div className="mt-4 flex flex-col items-center gap-3">
              <button type="button" onClick={forgot} disabled={recovering} className="rounded text-sm font-medium text-[#075dcc] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60">{recovering ? "Solicitando recuperação..." : "Esqueceu sua senha?"}</button>
              {confirmationRequired && (
                <button type="button" onClick={resendConfirmation} disabled={resending} className="rounded text-sm font-medium text-[#075dcc] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60">
                  {resending ? "Enviando novo link..." : "Reenviar confirmação por e-mail"}
                </button>
              )}
            </div>
          )}
          <div className="my-5 flex items-center gap-4 text-[#687b9a]"><span className="h-px flex-1 bg-[#c6d2e6]" /><span>Ou</span><span className="h-px flex-1 bg-[#c6d2e6]" /></div>
          <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setConfirmPassword(""); setShowPassword(false); setSent(false); setConfirmationRequired(false); }} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#0762c9] bg-white/50 px-3 text-center text-sm font-bold text-[#0750aa] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-base">
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
