/**
 * Tipos e rótulos do módulo administrativo da Escola Bíblica.
 * Aditivo: nada aqui é usado pelos módulos já existentes.
 */
import type { AccessTier, CourseLevel } from "./types";

export type ContentStatus = "draft" | "published" | "archived";

export const CONTENT_STATUS: { key: ContentStatus; label: string }[] = [
  { key: "draft", label: "Rascunho" },
  { key: "published", label: "Publicado" },
  { key: "archived", label: "Arquivado" },
];

export function statusLabel(status: ContentStatus): string {
  return CONTENT_STATUS.find((s) => s.key === status)?.label ?? status;
}

export type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  level: CourseLevel;
  tier: AccessTier;
  status: ContentStatus;
  order_index: number;
  published_at: string | null;
};

export type AdminModule = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  order_index: number;
  status: ContentStatus;
};

export type AdminLesson = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  summary: string;
  duration_minutes: number;
  tier: AccessTier;
  status: ContentStatus;
  order_index: number;
};

export type AdminStats = {
  courses: number;
  coursesPublished: number;
  coursesDraft: number;
  modules: number;
  lessons: number;
  freeLessons: number;
  premiumLessons: number;
  usersWithProgress: number;
};

/** Aula publicada exibida ao aluno. */
export type CatalogLesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  duration_minutes: number;
  tier: AccessTier;
  status: ContentStatus;
  order_index: number;
};

/** Card do catálogo do aluno. */

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  level: CourseLevel;
  tier: AccessTier;
  order_index: number;
  modules: number;
  lessons: number;
  completedLessons: number;
};

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
