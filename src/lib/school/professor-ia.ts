/**
 * Professor IA da Escola Bíblica (Dia 7) — regras e textos compartilhados.
 * Módulo puro e client-safe: nada de segredos ou acesso a banco aqui.
 */

/** Sugestões exibidas no painel (também funcionam como "modos de explicação"). */
export const PROFESSOR_SUGGESTIONS = [
  { mode: "simples", label: "Explique esta aula de forma mais simples." },
  { mode: "ideia", label: "Qual é a ideia principal desta aula?" },
  { mode: "exemplo", label: "Me dê um exemplo bíblico." },
  { mode: "contexto", label: "Explique o contexto desta passagem." },
  { mode: "resumo", label: "Faça um resumo dos pontos principais." },
  { mode: "perguntas", label: "Faça perguntas para testar meu conhecimento." },
  { mode: "aplicacao", label: "Como posso aplicar isso à minha vida?" },
  { mode: "aprofundar", label: "Quero aprofundar este assunto." },
] as const;


export type ProfessorSuggestion = (typeof PROFESSOR_SUGGESTIONS)[number];

export const PROFESSOR_IA_TITLE = "Professor IA";
export const PROFESSOR_IA_SUBTITLE = "Seu auxiliar para compreender melhor esta aula.";
export const PROFESSOR_IA_ERROR =
  "Não foi possível obter uma resposta agora. Tente novamente em alguns instantes.";
export const PROFESSOR_IA_LOADING = "Professor IA está preparando sua resposta…";
