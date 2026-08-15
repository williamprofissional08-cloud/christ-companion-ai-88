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

/** Blocos de destaque (frase-princípio da aula) são renderizados como citação. */
export const HIGHLIGHT_KIND = "destaque";

export function sectionLabel(kind: string): string {
  if (kind === HIGHLIGHT_KIND) return "Destaque";
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

/** Mídia da aula (áudio hoje; vídeo/thumbnail preparados para o futuro). */
export type LessonMediaItem = {
  id: string;
  kind: string;
  provider: string;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
};

export type LessonQuestion = {
  id: string;
  kind: string;
  prompt: string;
  options: string[];
  explanation: string | null;
  scripture_refs: string[];
  order_index: number;
};

/** Ponto onde o aluno parou (leitura e áudio). */
export type LessonResume = {
  readPercent: number;
  audioPositionSeconds: number;
};

export function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

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
  audio: LessonMediaItem | null;
  hasNarrationScript: boolean;
  questions: LessonQuestion[];
  resume: LessonResume;
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
