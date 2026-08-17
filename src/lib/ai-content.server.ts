import { generateText } from "ai";
import {
  aiGateway,
  BIBLICAL_SYSTEM_PROMPT,
  CHAT_MODEL,
  PROVIDER_OPTIONS,
  REFERENCE_RULE,
  parseJsonLoose,
} from "./ai-gateway.server";
import { extractReferences, hasReference } from "./scripture-refs";
import type {
  DevotionalContent,
  PlanDayContent,
  SearchContent,
  StudyContent,
  TrackStepContent,
} from "./types";

export type GenerationPreferences = {
  readingMinutes?: number;
  challengeType?: string;
  interests?: string[];
  dailyGoal?: string | null;
};

const CHALLENGE_HINTS: Record<string, string> = {
  oracao: "O desafio do dia deve ser sobre oração (tempo, intercessão, oração em família).",
  leitura: "O desafio do dia deve ser sobre leitura bíblica ou memorização de versículos.",
  servico: "O desafio do dia deve ser um ato prático de amor e serviço ao próximo.",
  jejum: "O desafio do dia deve envolver renúncia, jejum ou consagração.",
  equilibrado: "O desafio do dia pode variar entre oração, leitura, serviço e consagração.",
};

function preferencesPrompt(prefs?: GenerationPreferences) {
  if (!prefs) return "";
  const parts: string[] = [];
  if (prefs.readingMinutes) {
    parts.push(
      `A leitura e a reflexão devem caber em aproximadamente ${prefs.readingMinutes} minutos de leitura.`,
    );
  }
  if (prefs.challengeType && CHALLENGE_HINTS[prefs.challengeType]) {
    parts.push(CHALLENGE_HINTS[prefs.challengeType]!);
  }
  if (prefs.interests?.length) {
    parts.push(`Temas de interesse do usuário: ${prefs.interests.join(", ")}.`);
  }
  if (prefs.dailyGoal) {
    parts.push(`Objetivo espiritual diário do usuário: "${prefs.dailyGoal}".`);
  }
  return parts.length ? `\n\nPreferências do usuário:\n- ${parts.join("\n- ")}` : "";
}

/** Campos de texto que obrigatoriamente precisam conter referência bíblica. */
function missingReferenceFields(value: unknown, fields: string[]): string[] {
  const obj = value as Record<string, unknown>;
  return fields.filter((field) => {
    const raw = obj?.[field];
    const text = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : "";
    return !hasReference(text);
  });
}

async function complete(prompt: string, system: string) {
  const gateway = aiGateway();
  try {
    const { text } = await generateText({
      model: gateway(CHAT_MODEL),
      system,
      prompt,
      providerOptions: PROVIDER_OPTIONS,
    });
    return text;
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 402) {
      throw new Error(
        "Os créditos de IA do aplicativo acabaram. O conteúdo gerado por IA volta assim que os créditos forem renovados.",
      );
    }
    if (status === 429) {
      throw new Error("Muitas solicitações agora. Aguarde alguns instantes e tente novamente.");
    }
    throw new Error("Não foi possível gerar o conteúdo com a IA agora. Tente novamente em instantes.");
  }
}


async function generateJson<T>(prompt: string, requiredRefFields: string[] = []): Promise<T> {
  const system = `${BIBLICAL_SYSTEM_PROMPT}\n\n${REFERENCE_RULE}\n\nQuando pedirem JSON, responda SOMENTE com JSON válido, sem cercas de código e sem texto extra.`;
  let text = await complete(prompt, system);
  let parsed = parseJsonLoose<T>(text);

  if (requiredRefFields.length) {
    const missing = missingReferenceFields(parsed, requiredRefFields);
    if (missing.length) {
      text = await complete(
        `${prompt}\n\nA resposta anterior foi rejeitada porque os campos [${missing.join(", ")}] não citaram referência bíblica completa (Livro capítulo:versículo). Refaça o JSON inteiro incluindo referências completas nesses campos.\n\nResposta anterior:\n${text.slice(0, 4000)}`,
        system,
      );
      parsed = parseJsonLoose<T>(text);
    }
  }
  return parsed;
}

export function generateDevotional(day: string, prefs?: GenerationPreferences) {
  return generateJson<DevotionalContent>(
    `Crie o devocional cristão do dia ${day} em português do Brasil.
Responda em JSON com as chaves:
{"theme":"tema curto","verse":{"reference":"Livro capítulo:versículo","text":"texto do versículo (tradução em domínio público, estilo Almeida)"},"reflection":"3 a 5 parágrafos curtos","application":"aplicação prática concreta para hoje","prayer":"oração em primeira pessoa","challenge":"desafio espiritual do dia, uma frase","question":"pergunta para reflexão","motivational":"frase motivacional baseada na Bíblia com referência","readingSuggestion":"sugestão de leitura, ex.: Salmos 34:1-10"}
Use apenas ensino fiel às Escrituras e cite referências completas dentro dos textos.${preferencesPrompt(prefs)}`,
    ["reflection", "application", "prayer", "challenge", "motivational", "readingSuggestion"],
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
{"title":"título do dia","reading":"referência de leitura bíblica do dia (Livro cap:ver)","readingSummary":"resumo do que será lido","meditation":"2 a 4 parágrafos de meditação citando referências","prayer":"oração do dia com referências","challenge":"desafio prático do dia com referência","question":"pergunta para anotação"}`,
    ["reading", "meditation", "prayer", "challenge"],
  );
}

export function generateTrackStep(
  trackTitle: string,
  theme: string,
  summary: string,
  keyVerse: string,
  totalSteps: number,
  step: { index: number; kind: string; title: string; focus: string; reading: string },
  prefs?: GenerationPreferences,
) {
  const kindPrompt =
    step.kind === "checkpoint"
      ? `Esta etapa é um CHECKPOINT: ajude o usuário a revisar o que aprendeu até aqui, com perguntas de verificação e uma oração de consolidação.`
      : step.kind === "revisao"
        ? `Esta etapa é a REVISÃO FINAL da trilha: retome os principais aprendizados, liste as promessas centrais e proponha compromissos duradouros.`
        : `Esta é uma etapa de LEITURA guiada baseada em ${step.reading}.`;
  return generateJson<TrackStepContent>(
    `Trilha guiada de leitura "${trackTitle}" (tema: ${theme}, ${totalSteps} etapas). Resumo: ${summary}. Versículo-chave: ${keyVerse}.
Etapa ${step.index} de ${totalSteps} — "${step.title}". Foco: ${step.focus}. Leitura: ${step.reading}.
${kindPrompt}
Responda em JSON, em português do Brasil:
{"title":"título da etapa","reading":"referência de leitura (Livro cap:ver)","readingSummary":"resumo do trecho lido","meditation":"2 a 4 parágrafos com referências","prayer":"oração desta etapa com referências","challenge":"desafio prático com referência","questions":["3 perguntas para responder no checkpoint"],"references":["todas as referências usadas"]}${preferencesPrompt(prefs)}`,
    ["reading", "meditation", "prayer", "challenge"],
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
{"intro":"introdução","historicalContext":"contexto histórico e cultural","keyPoints":[{"title":"ponto","text":"explicação com referências"}],"application":"aplicação prática","crossReferences":["Referências cruzadas"],"questions":["perguntas para reflexão"],"conclusion":"conclusão","prayer":"oração final com referência"}
Inclua de 4 a 6 pontos-chave, 5 referências cruzadas e 4 perguntas. Quando houver diferentes interpretações cristãs, sinalize com respeito.`,
    ["intro", "historicalContext", "application", "crossReferences", "prayer"],
  );
}

export function generateSearch(query: string) {
  return generateJson<SearchContent>(
    `O usuário pesquisou o tema "${query}" em um aplicativo cristão.
Responda em JSON:
{"overview":"o que a Bíblia ensina sobre o tema, 2 a 3 parágrafos","verses":[{"reference":"Livro cap:ver","text":"texto do versículo","note":"por que ajuda"}],"practical":["passos práticos"],"prayer":"oração sobre o tema com referências","studySuggestions":["sugestões de estudo ou leitura"]}
Inclua de 5 a 8 versículos, 4 passos práticos e 3 sugestões de estudo.`,
    ["overview", "practical", "prayer"],
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
  const system = `${BIBLICAL_SYSTEM_PROMPT}\n\n${REFERENCE_RULE}`;
  const prompt = `Explique a passagem ${reference}. Texto: "${text.slice(0, 4000)}".
Organize em markdown com: **Contexto histórico**, **Significado espiritual**, **Aplicação prática**, **Referências cruzadas** e **Pergunta para reflexão**. Seja conciso (no máximo 400 palavras) e cite referências completas.`;
  let output = await complete(prompt, system);
  if (!hasReference(output)) {
    output = await complete(
      `${prompt}\n\nA resposta anterior foi rejeitada por não citar referências bíblicas completas (Livro capítulo:versículo). Refaça citando as referências.`,
      system,
    );
  }
  return { markdown: output, references: extractReferences(output) };
}
