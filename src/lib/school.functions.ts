import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { CourseOutline, UserAccess } from "./school/types";

/**
 * Camada de dados da Escola Bíblica (somente leitura do catálogo + acesso).
 * Nenhuma dessas funções é usada pelas telas atuais; existem para os próximos módulos.
 */

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserAccess> => {
    const { data } = await context.supabase
      .from("user_subscriptions")
      .select("tier, status, current_period_end")
      .eq("user_id", context.userId)
      .maybeSingle();

    const active =
      data?.tier === "premium" &&
      (data.status === "active" || data.status === "trialing") &&
      (!data.current_period_end || new Date(data.current_period_end) > new Date());

    return {
      tier: active ? "premium" : "free",
      isPremium: Boolean(active),
      status: data?.status ?? "inactive",
      currentPeriodEnd: data?.current_period_end ?? null,
    };
  });

export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("id, slug, title, subtitle, description, level, tier, cover_url, order_index")
      .eq("is_published", true)
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCourseOutline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(120) }).parse(input))
  .handler(async ({ data, context }): Promise<CourseOutline | null> => {
    const { data: course, error } = await context.supabase
      .from("courses")
      .select(
        "id, slug, title, subtitle, description, level, tier, cover_url, order_index, is_published, " +
          "course_modules(id, course_id, title, summary, order_index, " +
          "lessons(id, module_id, slug, title, summary, duration_minutes, tier, order_index))",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!course) return null;

    const { course_modules: rawModules, ...rest } = course as unknown as Record<string, unknown> & {
      course_modules: CourseOutline["modules"];
    };

    const modules = [...(rawModules ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.order_index - b.order_index) }));

    return { ...rest, modules } as CourseOutline;
  });

export const listMyCourseProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("course_progress")
      .select("course_id, completed_lessons, total_lessons, completed_at, updated_at")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
