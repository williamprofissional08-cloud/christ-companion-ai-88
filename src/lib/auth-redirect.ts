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

  if (message.includes("invalid login credentials") || message.includes("invalid_credentials"))
    return "Não foi possível entrar com esses dados. Confira o e-mail e a senha. Se você acabou de criar a conta, confirme primeiro o endereço pelo link enviado por e-mail; depois volte para entrar. Se não recebeu a mensagem, use a opção de reenviar confirmação.";
  if (message.includes("email not confirmed") || message.includes("email_not_confirmed"))
    return "Seu e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada ou spam e tente entrar novamente.";
  if (message.includes("already registered") || message.includes("already exists") || message.includes("user already registered"))
    return "Este e-mail já possui uma conta. Entre com sua senha ou use a recuperação de acesso.";
  if (message.includes("password") && (message.includes("at least") || message.includes("short") || message.includes("weak") || message.includes("characters")))
    return "A senha não atende aos requisitos de segurança do cadastro. Verifique o tamanho mínimo e tente outra senha.";
  if (message.includes("email_address_invalid") || (message.includes("email") && (message.includes("invalid") || message.includes("format"))))
    return "O endereço de e-mail parece inválido. Confira se foi digitado corretamente, sem espaços, e tente novamente.";
  if (message.includes("signup_disabled") || message.includes("signups not allowed"))
    return "O cadastro por e-mail está temporariamente desativado no serviço de autenticação. Tente entrar com Google ou avise o suporte.";
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
