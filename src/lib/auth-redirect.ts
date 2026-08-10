/** Utilitários de redirecionamento pós-login (apenas caminhos internos são aceitos). */

const KEY = "ccc-auth-redirect";

export function sanitizeRedirect(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/auth") || value.startsWith("/reset-password")) return null;
  return value;
}

export function rememberRedirect(value: unknown) {
  const safe = sanitizeRedirect(value);
  try {
    if (safe) sessionStorage.setItem(KEY, safe);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignora storage indisponível */
  }
}

export function takeRedirect(): string {
  try {
    const stored = sanitizeRedirect(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return stored ?? "/inicio";
  } catch {
    return "/inicio";
  }
}

/** Traduz erros de autenticação em mensagens amigáveis. */
export function friendlyAuthError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const message = raw.toLowerCase();
  if (message.includes("invalid login credentials")) return "Este e-mail ou senha está incorreto.";
  if (message.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (message.includes("already registered") || message.includes("already exists"))
    return "Esta conta já existe. Tente entrar com e-mail e senha ou com o Google.";
  if (message.includes("password")) return "Sua senha precisa ter pelo menos 6 caracteres.";
  if (message.includes("rate limit") || message.includes("too many"))
    return "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.";
  if (message.includes("access_denied") || message.includes("cancel"))
    return "Login cancelado. Você pode tentar novamente quando quiser.";
  return "Não foi possível concluir o login. Tente novamente.";
}
