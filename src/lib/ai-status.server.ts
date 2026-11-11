import type { SupabaseClient } from "@supabase/supabase-js";

export type AiStatus = {
  ok: boolean;
  status: number | null;
  state: "ok" | "sem_creditos" | "chave" | "bloqueado" | "limite" | "erro";
  message: string;
  checkedAt: string;
};

type ProviderError = {
  error?: { message?: string; status?: string };
  message?: string;
};

function readProviderMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as ProviderError;
  const message = payload.error?.message ?? payload.message;
  if (typeof message !== "string") return null;
  return message.replace(/\s+/g, " ").trim().slice(0, 240);
}

/**
 * Testa o mesmo caminho usado pelo Assistente IA e pelo Professor IA:
 * Supabase Edge Function -> Gemini. Não consulta nem depende dos créditos Lovable.
 */
export async function checkAiGatewayStatus(supabase: SupabaseClient): Promise<AiStatus> {
  const checkedAt = new Date().toISOString();

  try {
    const { error } = await supabase.functions.invoke("gemini-ai", {
      headers: { "x-gemini-proxy-secret": process.env["GEMINI_PROXY_SECRET"] ?? "" },
      body: {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Responda somente: OK" }],
        max_tokens: 8,
        stream: false,
      },
    });

    if (!error) {
      return {
        ok: true,
        status: 200,
        state: "ok",
        message: "Gemini disponível. Assistente IA e Professor IA podem utilizar o serviço.",
        checkedAt,
      };
    }

    const response =
      typeof error === "object" && "context" in error && error.context instanceof Response
        ? error.context
        : null;
    const status = response?.status ?? null;
    let providerMessage: string | null = null;

    if (response) {
      try {
        providerMessage = readProviderMessage(await response.clone().json());
      } catch {
        try {
          providerMessage = (await response.clone().text()).replace(/\s+/g, " ").trim().slice(0, 240);
        } catch {
          providerMessage = null;
        }
      }
    }

    if (status === 401) {
      return {
        ok: false,
        status,
        state: "chave",
        message: "A autenticação da chamada ao Gemini falhou. Verifique a sessão do aplicativo e a proteção JWT da função.",
        checkedAt,
      };
    }
    if (status === 402) {
      return {
        ok: false,
        status,
        state: "sem_creditos",
        message: "O provedor recusou a chamada por cobrança ou saldo. Isso não é um aviso de créditos Lovable.",
        checkedAt,
      };
    }
    if (status === 403) {
      return {
        ok: false,
        status,
        state: "bloqueado",
        message: providerMessage
          ? `O Google Gemini recusou o acesso: ${providerMessage}`
          : "O Google Gemini recusou o acesso. Verifique a chave e as permissões no Google AI Studio.",
        checkedAt,
      };
    }
    if (status === 429) {
      return {
        ok: false,
        status,
        state: "limite",
        message: providerMessage
          ? `A cota ou o limite de requisições do Gemini foi atingido: ${providerMessage}`
          : "A cota gratuita ou o limite de requisições do Gemini foi atingido. Aguarde e tente novamente.",
        checkedAt,
      };
    }

    return {
      ok: false,
      status,
      state: "erro",
      message: status
        ? `O Gemini respondeu com erro HTTP ${status}${providerMessage ? `: ${providerMessage}` : "."}`
        : `Não foi possível confirmar a resposta do Gemini: ${error.message}`,
      checkedAt,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      state: "erro",
      message: error instanceof Error
        ? `Falha ao testar a função Gemini no Supabase: ${error.message.slice(0, 200)}`
        : "Não foi possível conectar à função Gemini no Supabase.",
      checkedAt,
    };
  }
}
