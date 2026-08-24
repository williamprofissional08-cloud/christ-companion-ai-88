import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";

/** Provider do Lovable AI Gateway (uso exclusivo no servidor). */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export function aiGateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

/** Modelo de chat via Responses API, exigida pelos modelos OpenAI atuais. */
export function aiResponsesModel() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
  return provider.responses(CHAT_MODEL);
}

export const CHAT_MODEL = "openai/gpt-5.6-sol";
export const PROVIDER_OPTIONS = { lovable: { reasoningEffort: "none" } } as const;
export const RESPONSES_PROVIDER_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "medium",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

/**
 * Traduz falhas do AI Gateway em mensagem amigável (sem stack trace nem chaves).
 * Reutilizada pelo chat do app e pelo Professor IA.
 */
export function aiErrorMessage(error: unknown): string {
  const status = (error as { statusCode?: number; status?: number })?.statusCode
    ?? (error as { status?: number })?.status;
  if (status === 402) {
    return "O assistente está temporariamente indisponível. Tente novamente em alguns instantes.";
  }
  if (status === 429) {
    return "Muitas perguntas ao mesmo tempo. Aguarde alguns instantes e tente novamente.";
  }
  if (status === 401 || status === 403) {
    return "O serviço de IA está indisponível agora. Tente novamente em alguns instantes.";
  }
  return "Não foi possível obter uma resposta agora. Tente novamente em alguns instantes.";
}


export const BIBLICAL_SYSTEM_PROMPT = `Você é o assistente do aplicativo "Caminhando com Cristo", um companheiro espiritual cristão.

Princípios invioláveis:
- Fundamente TODAS as respostas exclusivamente na Bíblia Sagrada. Nunca ensine algo que contradiga as Escrituras.
- SEMPRE cite as referências bíblicas usadas (ex.: João 3:16; Salmos 23:1-3).
- Quando existirem diferentes interpretações entre tradições cristãs, diga isso com respeito e apresente as visões principais sem afirmar como fato aquilo que é objeto de debate.
- Não faça previsões, não dê diagnósticos médicos, jurídicos ou financeiros. Em situações de risco à vida, oriente com amor a buscar ajuda profissional imediata e ofereça oração.
- Não invente versículos. Se não tiver certeza da referência, diga isso.

Estilo:
- Escreva em português do Brasil, com tom pastoral, acolhedor, claro e encorajador.
- Use markdown com títulos curtos e listas quando ajudar.
- Ao explicar passagens, cubra: contexto histórico, significado espiritual, aplicação prática, referências cruzadas e uma pergunta para reflexão.
- Termine, quando fizer sentido, com uma oração breve.`;

/** Extrai JSON de uma resposta do modelo, com tolerância a cercas de código. */
export function parseJsonLoose<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?/gm, "")
    .replace(/```$/gm, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Não foi possível interpretar a resposta da IA.");
  }
}

/** Regra reforçada de citação bíblica aplicada a TODAS as chamadas de IA. */
export const REFERENCE_RULE = `REGRA OBRIGATÓRIA DE REFERÊNCIAS:
- Toda resposta, reflexão, explicação, desafio e ORAÇÃO deve citar ao menos uma referência bíblica completa no formato "Livro capítulo:versículo" (ex.: Filipenses 4:6-7).
- Nunca escreva apenas o nome do livro: sempre inclua capítulo e versículo(s).
- Nas orações, entrelace as referências no próprio texto (ex.: "... como está em Salmos 23:1").
- Se não tiver certeza da referência exata, diga isso explicitamente em vez de inventar.`;
