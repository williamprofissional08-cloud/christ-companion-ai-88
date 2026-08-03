import { generateText } from "ai";
import {
  aiGateway,
  BIBLICAL_SYSTEM_PROMPT,
  CHAT_MODEL,
  PROVIDER_OPTIONS,
  parseJsonLoose,
} from "./ai-gateway.server";
import type {
  DevotionalContent,
  PlanDayContent,
  SearchContent,
  StudyContent,
} from "./types";

async function generateJson<T>(prompt: string): Promise<T> {
  const gateway = aiGateway();
  const { text } = await generateText({
    model: gateway(CHAT_MODEL),
    system: `${BIBLICAL_SYSTEM_PROMPT}\n\nQuando pedirem JSON, responda SOMENTE com JSON válido, sem cercas de código e sem texto extra.`,
    prompt,
    providerOptions: PROVIDER_OPTIONS,
  });
  return parseJsonLoose<T>(text);
}

export function generateDevotional(day: string) {
  return generateJson<DevotionalContent>(
    `Crie o devocional cristão do dia ${day} em português do Brasil.
Responda em JSON com as chaves:
{"theme":"tema curto","verse":{"reference":"Livro capítulo:versículo","text":"texto do versículo (tradução em domínio público, estilo Almeida)"},"reflection":"3 a 5 parágrafos curtos","application":"aplicação prática concreta para hoje","prayer":"oração em primeira pessoa","challenge":"desafio espiritual do dia, uma frase","question":"pergunta para reflexão","motivational":"frase motivacional baseada na Bíblia com referência","readingSuggestion":"sugestão de leitura, ex.: Salmos 34"}
Use apenas ensino fiel às Escrituras e cite referências dentro dos textos quando usar outros versículos.`,
  );
}

export function generatePlanDay(
  planTitle: string,
  planSummary: string,
  keyVerse: string,
  totalDays: number,
  day: number,
) {
  return generateJson<PlanDayContent>(
    `Plano de oração cristão "${planTitle}" (${totalDays} dias). Resumo: ${planSummary}. Versículo-chave: ${keyVerse}.
Crie o conteúdo do DIA ${day} desse plano, em português do Brasil, avançando de forma progressiva e sem repetir os outros dias.
Responda em JSON:
{"title":"título do dia","reading":"referência de leitura bíblica do dia","readingSummary":"resumo do que será lido","meditation":"2 a 4 parágrafos de meditação citando referências","prayer":"oração do dia","challenge":"desafio prático do dia","question":"pergunta para anotação"}`,
  );
}

export function generateStudy(
  title: string,
  reference: string,
  summary: string,
  category: string,
) {
  return generateJson<StudyContent>(
    `Crie um estudo bíblico completo em português do Brasil sobre "${title}" (categoria: ${category}; base: ${reference}; resumo: ${summary}).
Responda em JSON:
{"intro":"introdução","historicalContext":"contexto histórico e cultural","keyPoints":[{"title":"ponto","text":"explicação com referências"}],"application":"aplicação prática","crossReferences":["Referências cruzadas"],"questions":["perguntas para reflexão"],"conclusion":"conclusão","prayer":"oração final"}
Inclua de 4 a 6 pontos-chave, 5 referências cruzadas e 4 perguntas. Quando houver diferentes interpretações cristãs, sinalize com respeito.`,
  );
}

export function generateSearch(query: string) {
  return generateJson<SearchContent>(
    `O usuário pesquisou o tema "${query}" em um aplicativo cristão.
Responda em JSON:
{"overview":"o que a Bíblia ensina sobre o tema, 2 a 3 parágrafos","verses":[{"reference":"Livro cap:ver","text":"texto do versículo","note":"por que ajuda"}],"practical":["passos práticos"],"prayer":"oração sobre o tema","studySuggestions":["sugestões de estudo ou leitura"]}
Inclua de 5 a 8 versículos, 4 passos práticos e 3 sugestões de estudo.`,
  );
}

const ALMEIDA_URL = "https://bible-api.com";

export type BiblePassage = {
  reference: string;
  text: string;
  verses: { chapter: number; verse: number; text: string }[];
};

export async function fetchPassage(reference: string): Promise<BiblePassage> {
  const url = `${ALMEIDA_URL}/${encodeURIComponent(reference)}?translation=almeida`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Não encontramos essa passagem. Tente por exemplo: João 3:16 ou Salmos 23");
  }
  const data = (await response.json()) as {
    reference?: string;
    text?: string;
    verses?: { chapter: number; verse: number; text: string }[];
  };
  return {
    reference: data.reference ?? reference,
    text: (data.text ?? "").trim(),
    verses: (data.verses ?? []).map((v) => ({
      chapter: v.chapter,
      verse: v.verse,
      text: v.text.trim(),
    })),
  };
}

export async function explainPassage(reference: string, text: string) {
  const gateway = aiGateway();
  const { text: output } = await generateText({
    model: gateway(CHAT_MODEL),
    system: BIBLICAL_SYSTEM_PROMPT,
    prompt: `Explique a passagem ${reference}. Texto: "${text.slice(0, 4000)}".
Organize em markdown com: **Contexto histórico**, **Significado espiritual**, **Aplicação prática**, **Referências cruzadas** e **Pergunta para reflexão**. Seja conciso (no máximo 400 palavras).`,
    providerOptions: PROVIDER_OPTIONS,
  });
  return output;
}
