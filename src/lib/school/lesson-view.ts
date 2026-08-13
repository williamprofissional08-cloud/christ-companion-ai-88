/**
 * Tipos e helpers puros da experiência do aluno na Escola Bíblica (Dia 3).
 * Aditivo: não é usado por nenhum módulo anterior.
 */
import type { AccessTier, CourseLevel, LessonStatus } from "./types";

export type StudentLesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  duration_minutes: number;
  tier: AccessTier;
  order_index: number;
  completed: boolean;
  locked: boolean;
};

export type StudentModule = {
  id: string;
  title: string;
  summary: string;
  order_index: number;
  lessons: StudentLesson[];
  completedLessons: number;
};

export type StudentCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  level: CourseLevel;
  tier: AccessTier;
};

export type CourseView = {
  course: StudentCourse;
  modules: StudentModule[];
  totalLessons: number;
  completedLessons: number;
  percent: number;
  nextLessonSlug: string | null;
  isPremium: boolean;
};

/** Seções previstas da página da aula. O conteúdo vem do banco (lesson_content). */
export const LESSON_SECTIONS = [
  { kind: "introducao", label: "Introdução" },
  { kind: "objetivos", label: "Objetivos" },
  { kind: "texto", label: "Conteúdo" },
  { kind: "referencias", label: "Referências bíblicas" },
  { kind: "exemplos", label: "Exemplos" },
  { kind: "aplicacao", label: "Aplicação" },
  { kind: "reflexao", label: "Reflexão" },
  { kind: "exercicio", label: "Exercício" },
  { kind: "oracao", label: "Oração" },
  { kind: "desafio", label: "Desafio" },
  { kind: "encerramento", label: "Encerramento" },
] as const;

export function sectionLabel(kind: string): string {
  return LESSON_SECTIONS.find((s) => s.kind === kind)?.label ?? "Conteúdo";
}

export type LessonContentBlock = {
  id: string;
  kind: string;
  title: string | null;
  body: string;
  scripture_refs: string[];
  order_index: number;
};

export type LessonNav = { slug: string; title: string } | null;

export type LessonView = {
  course: StudentCourse;
  module: { id: string; title: string; order_index: number; position: number };
  lesson: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    duration_minutes: number;
    tier: AccessTier;
    position: number;
  };
  blocks: LessonContentBlock[];
  status: LessonStatus;
  locked: boolean;
  lockReason: "premium" | null;
  prev: LessonNav;
  next: LessonNav;
  totalLessons: number;
  completedLessons: number;
};

export function percentOf(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
