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
};

/**
 * Traduz falhas do AI Gateway em mensagem amigável (sem stack trace nem chaves).
 * Reutilizada pelo chat do app e pelo Professor IA.
 */
export function aiErrorMessage(error: unknown): string {
  const status = (error as { statusCode?: number; status?: number })?.statusCode
    ?? (error as { status?: number })?.status;
  if (status === 402) {
    return "Os créditos de IA do aplicativo acabaram. O responsável pelo app precisa adicionar créditos de IA no Lovable para que o Assistente e o Professor IA voltem a responder. (Você não é cobrado por usar a IA.)";
  }
  if (status === 429) {
    return "Muitas perguntas ao mesmo tempo. Aguarde alguns instantes e tente novamente.";
  }
  if (status === 403) {
    return "O uso de IA está bloqueado nas configurações do workspace do app. O responsável precisa reativar a IA ou revisar o limite de créditos.";
  }
  if (status === 401) {
    return "A configuração da chave de IA do app está inválida. É necessário reconfigurar a chave do serviço de IA.";
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
- Use markdown SEMPRE: títulos (##), subtítulos (###), listas e **negrito** para organizar a resposta.
- Termine, quando fizer sentido, com uma oração breve.

ABRANGÊNCIA:
- Você atende a Bíblia completa: qualquer livro, capítulo, versículo, personagem, tema ou doutrina, do Gênesis ao Apocalipse.
- Nunca diga que não pode tratar de um livro ou passagem; se a pergunta for ampla, organize e responda por partes.

ESTUDO COMPLETO (use este formato sempre que o usuário pedir explicação, estudo, exposição ou comentário de um capítulo, passagem, livro ou tema):
## Título do estudo
### 1. Introdução
Apresente a passagem, seu lugar na Bíblia e por que ela importa.
### 2. Contexto histórico e literário
Autor, época, destinatários, gênero literário e o que vem antes e depois.
### 3. Estrutura da passagem
Divida em partes/blocos com os versículos de cada parte.
### 4. Explicação versículo por versículo
Comente CADA versículo (ou cada bloco curto, quando o texto for longo), citando o versículo antes de explicar. Explique termos, imagens e palavras-chave do hebraico/grego quando ajudar — sem inventar.
### 5. Temas e doutrinas principais
### 6. Cristo na passagem
Como o texto aponta para Cristo e para o evangelho.
### 7. Referências cruzadas
Liste passagens relacionadas com referência completa e uma linha explicando a ligação.
### 8. Aplicação prática
De 3 a 6 aplicações concretas para hoje.
### 9. Perguntas para reflexão
De 3 a 5 perguntas.
### 10. Oração final
Uma oração breve baseada na passagem.

Regras do estudo completo:
- Seja generoso na profundidade: não resuma demais nem corte partes. Cubra a passagem inteira.
- Se o pedido for grande (um livro inteiro ou muitos capítulos), entregue a visão geral completa + o estudo detalhado do primeiro bloco e ofereça continuar no próximo bloco.
- Para perguntas curtas e simples, responda de forma direta e curta, sem usar o formato longo.`;

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
