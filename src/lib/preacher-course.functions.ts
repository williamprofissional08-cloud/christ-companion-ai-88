import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const pointSchema = z.object({
  title: z.string().max(180).default(""),
  explanation: z.string().max(6000).default(""),
  references: z.string().max(1000).default(""),
  application: z.string().max(4000).default(""),
});

const messageSchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().uuid().nullable().optional(),
  lessonId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(180),
  scriptureText: z.string().max(1000).default(""),
  objective: z.string().max(3000).default(""),
  introduction: z.string().max(8000).default(""),
  points: z.array(pointSchema).min(1).max(6),
  application: z.string().max(8000).default(""),
  conclusion: z.string().max(8000).default(""),
  notes: z.string().max(8000).default(""),
});

export const getLessonWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ lessonId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [{ data: reflection, error: reflectionError }, { data: messages, error: messageError }, { data: favorite }] =
      await Promise.all([
        context.supabase
          .from("lesson_reflections")
          .select("meditation, prayer_reflection, exercise_response, updated_at")
          .eq("user_id", context.userId)
          .eq("lesson_id", data.lessonId)
          .maybeSingle(),
        context.supabase
          .from("sermon_messages")
          .select("id, title, scripture_text, objective, introduction, points, application, conclusion, notes, updated_at")
          .eq("user_id", context.userId)
          .eq("lesson_id", data.lessonId)
          .order("updated_at", { ascending: false }),
        context.supabase
          .from("favorites")
          .select("id")
          .eq("user_id", context.userId)
          .eq("kind", "estudo")
          .eq("reference", data.lessonId)
          .maybeSingle(),
      ]);
    if (reflectionError) throw new Error(reflectionError.message);
    if (messageError) throw new Error(messageError.message);
    return { reflection, messages: messages ?? [], favoriteId: favorite?.id ?? null };
  });

export const saveLessonReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      lessonId: z.string().uuid(),
      meditation: z.string().max(12000),
      prayerReflection: z.string().max(12000),
      exerciseResponse: z.string().max(12000),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("lesson_reflections").upsert(
      {
        user_id: context.userId,
        lesson_id: data.lessonId,
        meditation: data.meditation,
        prayer_reflection: data.prayerReflection,
        exercise_response: data.exerciseResponse,
      },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSermonMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => messageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      course_id: data.courseId ?? null,
      lesson_id: data.lessonId ?? null,
      title: data.title,
      scripture_text: data.scriptureText,
      objective: data.objective,
      introduction: data.introduction,
      points: data.points,
      application: data.application,
      conclusion: data.conclusion,
      notes: data.notes,
    };
    const query = data.id
      ? context.supabase.from("sermon_messages").update(payload).eq("id", data.id).eq("user_id", context.userId)
      : context.supabase.from("sermon_messages").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSermonMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sermon_messages")
      .select("id, title, scripture_text, objective, introduction, points, application, conclusion, notes, created_at, updated_at, lessons(title), courses(title)")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteSermonMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sermon_messages")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleStudyFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ lessonId: z.string().uuid(), title: z.string().max(180), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.active) {
      const { error } = await context.supabase.from("favorites").insert({
        user_id: context.userId,
        kind: "estudo",
        reference: data.lessonId,
        content: data.title,
      });
      if (error && error.code !== "23505") throw new Error(error.message);
      return { active: true };
    }
    const { error } = await context.supabase
      .from("favorites")
      .delete()
      .eq("user_id", context.userId)
      .eq("kind", "estudo")
      .eq("reference", data.lessonId);
    if (error) throw new Error(error.message);
    return { active: false };
  });

export const getPreacherCourseStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ courseId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [{ count: messages }, { data: progress }] = await Promise.all([
      context.supabase
        .from("sermon_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("course_id", data.courseId),
      context.supabase
        .from("lesson_progress")
        .select("lesson_id, updated_at, lessons(module_id)")
        .eq("user_id", context.userId)
        .eq("course_id", data.courseId),
    ]);
    const studiedBooks = new Set(
      (progress ?? []).map((row) => (row.lessons as { module_id?: string } | null)?.module_id).filter(Boolean),
    ).size;
    const studyDays = new Set((progress ?? []).map((row) => row.updated_at.slice(0, 10))).size;
    return { messages: messages ?? 0, studiedBooks, studyDays };
  });