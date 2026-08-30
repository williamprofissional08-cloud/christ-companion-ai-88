import { CHAT_MODEL } from "./ai-gateway.server";

export type AiStatus = {
  ok: boolean;
  status: number | null;
  /** Estado resumido: "ok" | "sem_creditos" | "chave" | "bloqueado" | "limite" | "erro" */
  state: "ok" | "sem_creditos" | "chave" | "bloqueado" | "limite" | "erro";
  message: string;
  checkedAt: string;
};

/** Faz uma chamada mínima ao provedor de IA para saber se há saldo/chave válida. */
export async function checkAiGatewayStatus(): Promise<AiStatus> {
  const checkedAt = new Date().toISOString();
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    return {
      ok: false,
      status: null,
      state: "chave",
      message: "A chave de IA do aplicativo não está configurada.",
      checkedAt,
    };
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{ role: "user", content: "ok" }],
        max_completion_tokens: 1,
      }),
    });

    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        state: "ok",
        message: "IA disponível. Assistente e Professor IA estão funcionando.",
        checkedAt,
      };
    }

    if (res.status === 402) {
      return {
        ok: false,
        status: 402,
        state: "sem_creditos",
        message:
          "Sem créditos de IA. Adicione créditos no workspace do Lovable para o Assistente e o Professor IA voltarem a responder.",
        checkedAt,
      };
    }
    if (res.status === 401) {
      return {
        ok: false,
        status: 401,
        state: "chave",
        message: "A chave de IA foi recusada. É preciso gerar uma nova chave.",
        checkedAt,
      };
    }
    if (res.status === 403) {
      return {
        ok: false,
        status: 403,
        state: "bloqueado",
        message: "O uso de IA está desativado ou limitado nas configurações do workspace.",
        checkedAt,
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        status: 429,
        state: "limite",
        message: "Muitas chamadas em sequência. Aguarde alguns instantes e teste novamente.",
        checkedAt,
      };
    }
    return {
      ok: false,
      status: res.status,
      state: "erro",
      message: `O provedor de IA respondeu com erro ${res.status}.`,
      checkedAt,
    };
  } catch {
    return {
      ok: false,
      status: null,
      state: "erro",
      message: "Não foi possível falar com o provedor de IA agora.",
      checkedAt,
    };
  }
}
