/**
 * Tipos de domínio da Escola Bíblica.
 * Módulo isolado: nada aqui é importado pelos módulos existentes
 * (Devocional, Assistente, Planos, Bíblia, Estudos, Trilhas).
 */

export type AccessTier = "free" | "premium";

export type CourseLevel = "iniciante" | "intermediario" | "avancado" | "profundo";

export const COURSE_LEVELS: { key: CourseLevel; label: string; hint: string }[] = [
  { key: "iniciante", label: "Iniciante", hint: "Primeiros passos, linguagem simples." },
  { key: "intermediario", label: "Intermediário", hint: "Aprofunda métodos e contexto." },
  { key: "avancado", label: "Avançado", hint: "Estudo estruturado e comparativo." },
  { key: "profundo", label: "Profundo", hint: "Teologia bíblica com maior densidade." },
];

export const LESSON_STATUS = ["nao_iniciada", "em_andamento", "concluida"] as const;
export type LessonStatus = (typeof LESSON_STATUS)[number];

/** Blocos de conteúdo escrito de uma aula. */
export type LessonContentKind = "texto" | "roteiro" | "resumo" | "referencias" | "desafio";

/** Mídias associadas à aula — sempre vindas do banco, nunca do código. */
export type LessonMediaKind = "video" | "audio";

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  level: CourseLevel;
  tier: AccessTier;
  cover_url: string | null;
  order_index: number;
  is_published: boolean;
};

export type CourseModule = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  order_index: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  summary: string;
  duration_minutes: number;
  tier: AccessTier;
  order_index: number;
};

export type CourseOutline = Course & {
  modules: (CourseModule & { lessons: Lesson[] })[];
};

/** Acesso do usuário. Enquanto não houver assinaturas, todos são "free". */
export type UserAccess = {
  tier: AccessTier;
  isPremium: boolean;
  status: string;
  currentPeriodEnd: string | null;
};

export function levelLabel(level: CourseLevel): string {
  return COURSE_LEVELS.find((l) => l.key === level)?.label ?? level;
}

/** Regra única de liberação de conteúdo premium, usada por UI e servidor. */
export function canAccess(tier: AccessTier, access: UserAccess): boolean {
  return tier === "free" || access.isPremium;
}
