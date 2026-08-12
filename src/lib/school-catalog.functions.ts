import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { CatalogCourse } from "./school/admin-types";

/** Catálogo do aluno: somente cursos publicados, com contagens e progresso próprio. */
export const listCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CatalogCourse[]> => {
    const { data: courses, error } = await context.supabase
      .from("courses")
      .select("id, slug, title, subtitle, description, level, tier, order_index")
      .eq("status", "published")
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    const list = courses ?? [];
    if (!list.length) return [];

    const ids = list.map((c) => c.id);
    const [{ data: modules }, { data: progress }] = await Promise.all([
      context.supabase
        .from("course_modules")
        .select("id, course_id, lessons(id, status)")
        .in("course_id", ids)
        .eq("status", "published"),
      context.supabase
        .from("course_progress")
        .select("course_id, completed_lessons")
        .eq("user_id", context.userId),
    ]);

    const progressMap = new Map((progress ?? []).map((p) => [p.course_id, p.completed_lessons]));

    return list.map((course) => {
      const mods = (modules ?? []).filter((m) => m.course_id === course.id);
      const lessons = mods.reduce(
        (total, m) =>
          total +
          ((m as unknown as { lessons?: { status: string }[] }).lessons ?? []).filter(
            (l) => l.status === "published",
          ).length,
        0,
      );
      return {
        ...course,
        modules: mods.length,
        lessons,
        completedLessons: progressMap.get(course.id) ?? 0,
      } as CatalogCourse;
    });
  });

/** Detalhe do curso publicado, com módulos e aulas publicadas. */
export const getCatalogCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: course, error } = await context.supabase
      .from("courses")
      .select("id, slug, title, subtitle, description, level, tier")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!course) return null;

    const { data: modules } = await context.supabase
      .from("course_modules")
      .select("id, title, summary, order_index, lessons(id, slug, title, summary, duration_minutes, tier, status, order_index)")
      .eq("course_id", course.id)
      .eq("status", "published")
      .order("order_index", { ascending: true });

    const cleaned = (modules ?? []).map((m) => {
      const raw = (m as unknown as { lessons?: Record<string, unknown>[] }).lessons ?? [];
      const lessons = raw
        .filter((l) => l["status"] === "published")
        .sort((a, b) => Number(a["order_index"]) - Number(b["order_index"]));
      return { ...m, lessons };
    });

    return { course, modules: cleaned };
  });
