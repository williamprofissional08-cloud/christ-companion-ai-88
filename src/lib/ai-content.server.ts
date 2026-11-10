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
        "O conteúdo gerado por IA está temporariamente indisponível. Tente novamente em instantes.",
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

export function generateDevotional(
  day: string,
  prefs?: GenerationPreferences,
  recentDevotionals: Array<{ theme: string; reference: string }> = [],
) {
  const recentHistory = recentDevotionals.length
    ? recentDevotionals.map((item) => `- Tema: "${item.theme}"; passagem principal: ${item.reference}`).join("\\n")
    : "- Nenhum histórico recente disponível.";
  return generateJson<DevotionalContent>(
    `Crie um devocional cristão novo para o dia ${day}, em português do Brasil.
HISTÓRICO RECENTE — NÃO REPITA:
${recentHistory}
Regra obrigatória de variedade: não reutilize o mesmo livro bíblico + capítulo, a mesma passagem principal, o mesmo tema central nem apenas troque palavras de um devocional recente. Evite também escolher um texto que seja apenas uma continuação imediata da mesma passagem. Considere os últimos 14 dias como janela de bloqueio; depois desse período, uma passagem pode voltar a ser usada ocasionalmente, desde que o enfoque e a aplicação sejam realmente diferentes.
Alterne deliberadamente entre livros e gêneros bíblicos (Evangelhos, Lei, históricos, poesia/sabedoria, profetas, cartas), personagens, contextos e temas. Escolha uma passagem adequada e pouco recente, com contexto interpretado corretamente; não escolha sempre Mateus ou Salmos. Cada dia deve trazer uma abordagem bíblica distinta e substancial, não um texto genérico reciclado.
Responda em JSON com as chaves:
{"theme":"tema curto e específico","verse":{"reference":"Livro capítulo:versículo","text":"texto do versículo (tradução em domínio público, estilo Almeida)"},"reflection":"3 a 5 parágrafos curtos explicando o contexto e a mensagem do texto","application":"aplicação prática concreta para hoje","prayer":"oração em primeira pessoa coerente com a passagem","challenge":"desafio espiritual do dia, uma frase","question":"pergunta específica para reflexão","motivational":"frase fundamentada na passagem com referência","readingSuggestion":"sugestão complementar de leitura diferente da passagem principal"}
Use apenas ensino fiel às Escrituras, cite referências completas e diferencie o sentido original do texto da aplicação atual. Não invente citações bíblicas.${preferencesPrompt(prefs)}`,
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
  depth: "simple" | "deep" = "simple",
) {
  if (depth === "deep") {
    return generateJson<StudyContent>(
      `Crie um Estudo Bíblico Aprofundado em português do Brasil sobre "${title}" (categoria: ${category}; base: ${reference}; resumo: ${summary}).
Use o modelo de apostila de formação de pregadores descrito nas instruções: objetivo, contexto, arquitetura, exposição por versículo ou bloco curto, teologia, referências explicadas, Cristo, aplicações, oficina do pregador, exercícios e oração. Analise texto e contexto antes de escrever. Não reproduza afirmações do exemplo sem revisão crítica.
Responda SOMENTE em JSON com esta estrutura:
{"version":2,"depth":"deep","intro":"introdução com referência","historicalContext":"síntese contextual com referência","keyPoints":[{"title":"ideia central","text":"explicação com referência"}],"application":"aplicação fundamentada com referência","crossReferences":["referência completa e ligação"],"questions":["pergunta"],"conclusion":"síntese","prayer":"oração com referência","sections":[{"id":"identificador único e estável","title":"título didático","body":"markdown da seção com classificações e referências","kind":"introduction","confidence":"high","scriptureRefs":["Livro capítulo:versículo"]}]}
sections deve conter o estudo inteiro, não títulos vazios ou resumos repetidos. kind deve ser introduction, scripture, context, analysis, theology, cross-references, application, reflection, summary, challenge, sources, reasoning ou other; confidence deve ser high, probable, debated ou uncertain, conforme as conclusões da seção. Classifique também afirmações individuais no body. A oficina usa kind application e os exercícios reflection.
Não invente bibliografia ou diga que consultou fontes sem acesso real. Não apresente perguntas históricas debatidas como testes de resposta única. Se a referência abranger um livro inteiro, entregue panorama e exposição do primeiro bloco, declarando o limite, sem fingir que todos os capítulos foram expostos.`,
      ["intro", "historicalContext", "application", "crossReferences", "prayer"],
    );
  }
  return generateJson<StudyContent>(
    `Crie um estudo bíblico completo em português do Brasil sobre "${title}" (categoria: ${category}; base: ${reference}; resumo: ${summary}).
Responda em JSON:
{"intro":"introdução","historicalContext":"contexto histórico e cultural","keyPoints":[{"title":"ponto","text":"explicação com referências"}],"application":"aplicação prática","crossReferences":["Referências cruzadas"],"questions":["perguntas para reflexão"],"conclusion":"conclusão","prayer":"oração final com referência"}
Inclua de 4 a 6 pontos-chave, 5 referências cruzadas e 4 perguntas. Quando houver diferentes interpretações cristãs, sinalize com respeito.`,
    ["intro", "historicalContext", "application", "crossReferences", "prayer"],
  );
}

/** Produces a chapter-scoped study using the same editorial depth as the curated Genesis 1 model. */
export async function generateChapterStudy(bookName: string, chapter: number, category: string) {
  const reference = `${bookName} ${chapter}`;
  const content = await generateJson<StudyContent>(
    `Crie uma apostila aprofundada de formação bíblica sobre o capítulo inteiro "${reference}" (seção canônica: ${category}), em português do Brasil.
O estudo precisa tratar SOMENTE deste capítulo, não fazer panorama do livro no lugar da exposição. O leitor deverá abrir e ler o capítulo na Bíblia antes do estudo. Não invente o texto dos versículos, não reproduza longos trechos de traduções protegidas e não atribua palavras a um versículo sem segurança. Use referências completas e verificáveis.
Siga a profundidade editorial do estudo-modelo de Gênesis 1, mas adapte a estrutura ao gênero e ao conteúdo real do capítulo. Não force temas de criação, profecia, aliança ou Cristo onde não houver ligação textual/canônica legítima.
A apostila deve conter seções completas e substanciais:
1) objetivo e limites da leitura;
2) estrutura literária do capítulo e divisão em perícopes, cobrindo todos os versículos sem lacunas;
3) contexto histórico, cultural, geográfico e literário relevante, separando fatos, tradição e hipóteses;
4) exposição versículo por versículo ou por blocos curtos coerentes, com referências exatas para cada bloco;
5) palavras originais somente quando forem realmente relevantes, com transliteração, sentido no contexto e cautela contra falácia etimológica;
6) temas e verdades teológicas sustentados pelo capítulo;
7) conexão com Cristo e o restante da Bíblia: explícita quando o Novo Testamento ou o próprio cânon a estabelecer; tipológica apenas quando houver fundamento, identificando-a como interpretação;
8) referências cruzadas explicadas, não apenas uma lista;
9) interpretações cristãs divergentes quando o texto for debatido, apresentadas com equilíbrio e sem declarar consenso inexistente;
10) erros de leitura e aplicações que o texto não autoriza;
11) aplicações pastorais concretas, distinguindo princípio, inferência e aplicação;
12) oficina do pregador com ao menos um esboço expositivo cuja ideia central venha do capítulo e cujos pontos tenham referências;
13) perguntas de observação, interpretação e aplicação;
14) transparência das fontes: use o texto bíblico e referências identificáveis; não diga que consultou comentários, léxicos ou obras que não foram realmente fornecidos;
15) oração final coerente com o capítulo.
Use rótulos visíveis [TEXTO BÍBLICO], [CONTEXTO], [INFERÊNCIA], [INTERPRETAÇÃO], [APLICAÇÃO] e [ESPECULAÇÃO] quando necessário. Dê confidence high/probable/debated/uncertain conforme a força da evidência. Nunca transforme especulação em doutrina.
Para narrativas, respeite personagens, sequência e contexto. Para poesia, observe paralelismo, imagens e gênero. Para lei, explique destinatários, aliança e contexto antes de aplicar. Para profetas, diferencie contexto histórico, cumprimento e leituras escatológicas. Para evangelhos, respeite o contexto do ministério de Jesus e diferenças entre relatos. Para cartas, acompanhe argumento e destinatários. Para Apocalipse, reconheça gênero apocalíptico e apresente posições interpretativas sem dogmatismo.
Não invente datas, autores, cenários, citações, números de versículos ou fatos arqueológicos. Se algo for incerto, diga isso claramente.
Responda SOMENTE em JSON válido:
{"version":2,"depth":"deep","intro":"objetivo e introdução com referência","historicalContext":"contexto histórico-literário com referências","keyPoints":[{"title":"ponto","text":"exposição com referência"}],"application":"aplicação fundamentada","crossReferences":["referência completa — relação explicada"],"questions":["pergunta de revisão"],"conclusion":"síntese fiel ao capítulo","prayer":"oração final coerente com o capítulo","sections":[{"id":"id-estavel","title":"título da seção","body":"conteúdo completo em Markdown","kind":"introduction","confidence":"high","scriptureRefs":["Livro capítulo:versículo"]}]}
A seção de exposição deve cobrir todas as perícopes do capítulo. Não use títulos vazios, repetições artificiais ou texto genérico que poderia servir igualmente para qualquer capítulo.`,
    ["intro", "historicalContext", "application", "crossReferences", "prayer"],
  );
  const sections = content.sections ?? [];
  if (sections.length < 12 || sections.some((section) => !section.title?.trim() || !section.body?.trim())) {
    throw new Error("O estudo deste capítulo ficou incompleto. Tente novamente para gerar a apostila completa.");
  }
  return content;
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

export async function explainPassage(reference: string, text: string) {
  const system = `${BIBLICAL_SYSTEM_PROMPT}\n\n${REFERENCE_RULE}`;
  const prompt = `Faça o ESTUDO COMPLETO da passagem ${reference}. Texto: "${text.slice(0, 6000)}".
Use o formato de "ESTUDO COMPLETO" descrito nas suas instruções (objetivo, contexto histórico e literário, arquitetura, explicação versículo por versículo, temas e doutrinas, Cristo na passagem, referências cruzadas, aplicação, oficina do pregador, exercícios de fixação e oração final). Cubra a passagem inteira, com markdown organizado, classificações e referências completas. Adapte a apostila ao gênero desta passagem sem copiar interpretações do exemplo como fatos.`;
  let output = await complete(prompt, system);
  if (!hasReference(output)) {
    output = await complete(
      `${prompt}\n\nA resposta anterior foi rejeitada por não citar referências bíblicas completas (Livro capítulo:versículo). Refaça citando as referências.`,
      system,
    );
  }
  return { markdown: output, references: extractReferences(output) };
}
