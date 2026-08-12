import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { assertAdmin, isAdminUser } from "./school/admin-guard";
import type { AdminCourse, AdminLesson, AdminModule, AdminStats } from "./school/admin-types";

const statusEnum = z.enum(["draft", "published", "archived"]);
const levelEnum = z.enum(["iniciante", "intermediario", "avancado", "profundo"]);
const tierEnum = z.enum(["free", "premium"]);

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => isAdminUser(context.supabase, context.userId));

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    await assertAdmin(context.supabase, context.userId);
    const [courses, modules, lessons, progress] = await Promise.all([
      context.supabase.from("courses").select("status"),
      context.supabase.from("course_modules").select("id"),
      context.supabase.from("lessons").select("tier"),
      context.supabase.from("course_progress").select("user_id"),
    ]);
    const courseRows = courses.data ?? [];
    const lessonRows = lessons.data ?? [];
    return {
      courses: courseRows.length,
      coursesPublished: courseRows.filter((c) => c.status === "published").length,
      coursesDraft: courseRows.filter((c) => c.status === "draft").length,
      modules: modules.data?.length ?? 0,
      lessons: lessonRows.length,
      freeLessons: lessonRows.filter((l) => l.tier === "free").length,
      premiumLessons: lessonRows.filter((l) => l.tier === "premium").length,
      usersWithProgress: new Set((progress.data ?? []).map((p) => p.user_id)).size,
    };
  });

export const adminListCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCourse[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("courses")
      .select("id, slug, title, subtitle, description, level, tier, status, order_index, published_at")
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminCourse[];
  });

export const adminSaveCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(3).max(80),
        title: z.string().min(3).max(160),
        subtitle: z.string().max(300).nullable().optional(),
        description: z.string().min(1).max(4000),
        level: levelEnum,
        tier: tierEnum,
        status: statusEnum,
        order_index: z.number().int().min(0).max(999),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      description: data.description,
      level: data.level,
      tier: data.tier,
      status: data.status,
      order_index: data.order_index,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("courses").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("courses")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminSetCourseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: statusEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("courses")
      .update({
        status: data.status,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: course, error } = await context.supabase
      .from("courses")
      .select("id, slug, title, subtitle, description, level, tier, status, order_index, published_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!course) return null;

    const { data: modules } = await context.supabase
      .from("course_modules")
      .select("id, course_id, title, summary, order_index, status")
      .eq("course_id", data.id)
      .order("order_index", { ascending: true });

    const moduleIds = (modules ?? []).map((m) => m.id);
    const { data: lessons } = moduleIds.length
      ? await context.supabase
          .from("lessons")
          .select("id, module_id, slug, title, summary, duration_minutes, tier, status, order_index")
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true })
      : { data: [] as AdminLesson[] };

    return {
      course: course as AdminCourse,
      modules: (modules ?? []) as AdminModule[],
      lessons: (lessons ?? []) as AdminLesson[],
    };
  });

export const adminSaveModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        course_id: z.string().uuid(),
        title: z.string().min(2).max(160),
        summary: z.string().max(2000).default(""),
        order_index: z.number().int().min(0).max(999),
        status: statusEnum,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("course_modules").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("course_modules")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminDeleteModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("course_modules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        module_id: z.string().uuid(),
        slug: z.string().min(3).max(80),
        title: z.string().min(2).max(160),
        summary: z.string().max(2000).default(""),
        duration_minutes: z.number().int().min(1).max(600),
        tier: tierEnum,
        status: statusEnum,
        order_index: z.number().int().min(0).max(999),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("lessons").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("lessons")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminDeleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Blocos de conteúdo da aula (abertura, ensino, aplicação, oração, desafio...). */
export const adminListLessonContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ lesson_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("lesson_content")
      .select("id, lesson_id, kind, title, body, scripture_refs, order_index")
      .eq("lesson_id", data.lesson_id)
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSaveLessonContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        lesson_id: z.string().uuid(),
        kind: z.string().min(2).max(40),
        title: z.string().max(200).nullable().optional(),
        body: z.string().min(1).max(20000),
        scripture_refs: z.array(z.string().max(120)).max(50).default([]),
        order_index: z.number().int().min(0).max(999),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const payload = { ...rest, title: rest.title ?? null };
    if (id) {
      const { error } = await context.supabase.from("lesson_content").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("lesson_content")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminDeleteLessonContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("lesson_content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Questões da aula: múltipla escolha, verdadeiro/falso e resposta curta. */
export const adminListLessonQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ lesson_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("lesson_questions")
      .select("id, lesson_id, kind, prompt, options, answer_key, explanation, order_index")
      .eq("lesson_id", data.lesson_id)
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSaveLessonQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        lesson_id: z.string().uuid(),
        kind: z.enum(["multipla_escolha", "verdadeiro_falso", "resposta_curta"]),
        prompt: z.string().min(3).max(2000),
        options: z.array(z.string().max(300)).max(10).default([]),
        answer_key: z.string().max(300).nullable().optional(),
        explanation: z.string().max(2000).nullable().optional(),
        order_index: z.number().int().min(0).max(999),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      options: rest.options,
      answer_key: rest.answer_key ?? null,
      explanation: rest.explanation ?? null,
    };
    if (id) {
      const { error } = await context.supabase.from("lesson_questions").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("lesson_questions")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminDeleteLessonQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("lesson_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
