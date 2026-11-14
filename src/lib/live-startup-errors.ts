/**
 * Public-facing errors for livestream startup. Avoid falsely blaming camera
 * permissions when the failure comes from the Supabase schema or RLS.
 * Never include database detail messages or tokens in the interface.
 */
export type LiveIssue = unknown;

function shape(error: LiveIssue) {
  const issue = typeof error === "object" && error !== null
    ? error as Record<string, unknown> : {};
  return {
    code: typeof issue['code'] === "string" ? issue['code'] : "",
    status: typeof issue['status'] === "number" ? issue['status'] : 0,
    name: typeof issue['name'] === "string" ? issue['name'] : "",
    message: typeof issue['message'] === "string" ? issue['message'] : "",
  };
}

export function explainLiveBackendError(error: LiveIssue): string {
  const issue = shape(error);
  const message = issue['message'].toLowerCase();

  if (issue['code'] === "PGRST205" || issue['code'] === "42P01" ||
    (message.includes("schema cache") && message.includes("table")) ||
    message.includes("relation does not exist")) {
    return "O servidor ainda não tem as tabelas necessárias para as lives. A equipe precisa ativar a infraestrutura no Supabase. Não é um problema de autorização da câmera.";
  }
  if (issue['code'] === "42501" || issue['status'] === 403 ||
    message.includes("permission denied")) {
    return "O servidor bloqueou esta operação na live. É preciso revisar as permissões de acesso (RLS) no Supabase. A câmera não é a causa.";
  }
  if (issue['code'] === "PGRST301" || issue['status'] === 401 ||
    message.includes("jwt expired") || message.includes("invalid jwt")) {
    return "Sua sessão não foi aceita pelo servidor. Saia e entre novamente na sua conta do Caminho Divino.";
  }
  if (message.includes("failed to fetch") || message.includes("networkerror") ||
    issue['status'] === 503 || issue['status'] === 502) {
    return "Não foi possível alcançar o servidor de lives. Confira sua conexão e tente novamente.";
  }
  return "O servidor não conseguiu preparar a live. Verifique a conexão com o Supabase e tente novamente. Não é necessário autorizar a câmera outra vez.";
}

export function explainLiveMediaError(error: LiveIssue): string {
  const issue = shape(error);
  switch (issue['name']) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "O navegador está bloqueando o acesso à câmera ou ao microfone nesta aba. Confira a permissão deste site e, se estiver em uma prévia incorporada, abra o aplicativo diretamente no navegador.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "Câmera ou microfone não encontrado. Verifique se o dispositivo está conectado e disponível.";
    case "NotReadableError":
    case "TrackStartError":
      return "A câmera ou o microfone está ocupado ou indisponível no sistema. Feche outros aplicativos que estejam usando esses dispositivos e tente novamente.";
    case "OverconstrainedError":
      return "A câmera não suporta a configuração de vídeo solicitada. Tente novamente com a configuração padrão.";
    case "AbortError":
      return "O navegador interrompeu a ativação da câmera ou do microfone. Feche outras chamadas e tente novamente.";
    default:
      return "Não foi possível ativar a câmera ou o microfone neste navegador. Confira as permissões do site e o dispositivo utilizado.";
  }
}

export function isMissingMediaDevice(error: LiveIssue): boolean {
  const name = shape(error).name;
  return name === "NotFoundError" || name === "DevicesNotFoundError" ||
    name === "OverconstrainedError";
}

/** Nothing should ask for hardware access if the live tables are absent. */
export async function checkLiveBackendReady(
  check: (table: "community_live_sessions" | "community_live_participants" | "community_live_signals") => Promise<LiveIssue>,
): Promise<string | null> {
  for (const table of ["community_live_sessions", "community_live_participants", "community_live_signals"] as const) {
    const error = await check(table);
    if (error) return explainLiveBackendError(error);
  }
  return null;
}
