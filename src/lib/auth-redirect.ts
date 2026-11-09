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

  if (message.includes("invalid login credentials"))
    return "Este e-mail ou senha está incorreto.";
  if (message.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar. Verifique também a caixa de spam.";
  if (message.includes("already registered") || message.includes("already exists") || message.includes("user already registered"))
    return "Este e-mail já possui uma conta. Entre com sua senha ou use a recuperação de acesso.";
  if (message.includes("password") && (message.includes("at least") || message.includes("short") || message.includes("weak") || message.includes("characters")))
    return "A senha não atende aos requisitos de segurança do cadastro. Verifique o tamanho mínimo e tente outra senha.";
  if (message.includes("email") && (message.includes("invalid") || message.includes("format")))
    return "O endereço de e-mail informado não é válido.";
  if (message.includes("redirect") && (message.includes("allow") || message.includes("url")))
    return "O endereço de retorno do cadastro não está autorizado nas configurações de autenticação. Entre em contato com o suporte.";
  if (message.includes("rate limit") || message.includes("too many") || message.includes("over_email_send_rate_limit"))
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("fetch"))
    return "Não foi possível conectar ao serviço de cadastro. Verifique sua internet e tente novamente.";
  if (message.includes("access_denied") || message.includes("cancel"))
    return "Login cancelado. Você pode tentar novamente quando quiser.";

  // Preserve the service message instead of incorrectly blaming the password.
  return raw.trim() || "Não foi possível concluir o cadastro. Tente novamente.";
}
