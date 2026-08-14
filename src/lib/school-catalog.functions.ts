import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { CatalogCourse } from "./school/admin-types";
import type { CourseView, LessonView } from "./school/lesson-view";
import { isPremium, loadCourseView, syncCourseProgress } from "./school/lesson-queries";

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
    const [{ data: modules }, { data: lessonProgress }] = await Promise.all([
      context.supabase
        .from("course_modules")
        .select("id, course_id, title, order_index, lessons(id, slug, title, status, order_index)")
        .in("course_id", ids)
        .eq("status", "published")
        .order("order_index", { ascending: true }),
      context.supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("user_id", context.userId),
    ]);

    const done = new Set(
      (lessonProgress ?? []).filter((p) => p.status === "concluida").map((p) => p.lesson_id),
    );

    return list.map((course) => {
      const mods = (modules ?? [])
        .filter((m) => m.course_id === course.id)
        .sort((a, b) => a.order_index - b.order_index);
      const flat = mods.flatMap((m) =>
        (
          (m as unknown as {
            lessons?: { id: string; slug: string; title: string; status: string; order_index: number }[];
          }).lessons ?? []
        )
          .filter((l) => l.status === "published")
          .sort((a, b) => a.order_index - b.order_index)
          .map((l) => ({ ...l, moduleTitle: m.title })),
      );
      const completedLessons = flat.filter((l) => done.has(l.id)).length;
      const next = flat.find((l) => !done.has(l.id)) ?? null;
      return {
        ...course,
        modules: mods.length,
        lessons: flat.length,
        completedLessons,
        nextLessonSlug: next?.slug ?? null,
        nextLessonTitle: next?.title ?? null,
        nextModuleTitle: next?.moduleTitle ?? null,
      } as CatalogCourse;
    });
  });

/** Detalhe do curso publicado: módulos, aulas, bloqueios e progresso do aluno. */
export const getStudentCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(120) }).parse(input))
  .handler(async ({ data, context }): Promise<CourseView | null> => {
    return loadCourseView(context.supabase, context.userId, data.slug);
  });

/** Aula publicada + conteúdo, com navegação anterior/próxima e controle de acesso. */
export const getStudentLesson = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().max(120), lessonSlug: z.string().max(120) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<LessonView | null> => {
    const view = await loadCourseView(context.supabase, context.userId, data.slug);
    if (!view) return null;

    const flat = view.modules.flatMap((m) =>
      m.lessons.map((l) => ({ lesson: l, module: m })),
    );
    const index = flat.findIndex((item) => item.lesson.slug === data.lessonSlug);
    if (index === -1) return null;
    const current = flat[index]!;

    const premium = view.isPremium;
    const locked = current.lesson.tier === "premium" && !premium;

    const { data: blocks } = locked
      ? { data: [] }
      : await context.supabase
          .from("lesson_content")
          .select("id, kind, title, body, scripture_refs, order_index")
          .eq("lesson_id", current.lesson.id)
          .order("order_index", { ascending: true });

    const [{ data: media }, { data: questions }, { data: rawLesson }, { data: progressRow }] =
      locked
        ? [{ data: [] }, { data: [] }, { data: null }, { data: null }]
        : await Promise.all([
            context.supabase
              .from("lesson_media")
              .select("id, kind, provider, url, thumbnail_url, duration_seconds, order_index")
              .eq("lesson_id", current.lesson.id)
              .order("order_index", { ascending: true }),
            context.supabase
              .from("lesson_questions")
              .select("id, kind, prompt, options, explanation, scripture_refs, order_index")
              .eq("lesson_id", current.lesson.id)
              .order("order_index", { ascending: true }),
            context.supabase
              .from("lessons")
              .select("tts_script")
              .eq("id", current.lesson.id)
              .maybeSingle(),
            context.supabase
              .from("lesson_progress")
              .select("read_percent, audio_position_seconds")
              .eq("user_id", context.userId)
              .eq("lesson_id", current.lesson.id)
              .maybeSingle(),
          ]);

    const audio = (media ?? []).find((m) => m.kind === "audio") ?? null;

    const moduleIndex = view.modules.findIndex((m) => m.id === current.module.id);


    return {
      course: view.course,
      module: {
        id: current.module.id,
        title: current.module.title,
        order_index: current.module.order_index,
        position: moduleIndex + 1,
      },
      lesson: {
        id: current.lesson.id,
        slug: current.lesson.slug,
        title: current.lesson.title,
        summary: current.lesson.summary,
        duration_minutes: current.lesson.duration_minutes,
        tier: current.lesson.tier,
        position: current.module.lessons.findIndex((l) => l.id === current.lesson.id) + 1,
      },
      blocks: (blocks ?? []).map((b) => ({
        id: b.id,
        kind: b.kind,
        title: b.title,
        body: b.body,
        scripture_refs: b.scripture_refs ?? [],
        order_index: b.order_index,
      })),
      audio: audio
        ? {
            id: audio.id,
            kind: audio.kind,
            provider: audio.provider,
            url: audio.url,
            thumbnail_url: audio.thumbnail_url,
            duration_seconds: audio.duration_seconds,
            order_index: audio.order_index,
          }
        : null,
      hasNarrationScript: Boolean(
        (rawLesson as { tts_script?: string | null } | null)?.tts_script?.trim(),
      ),
      questions: (questions ?? []).map((q) => ({
        id: q.id,
        kind: q.kind,
        prompt: q.prompt,
        options: Array.isArray(q.options) ? (q.options as unknown[]).map((o) => String(o)) : [],
        explanation: q.explanation,
        scripture_refs: q.scripture_refs ?? [],
        order_index: q.order_index,
      })),
      resume: {
        readPercent: progressRow?.read_percent ?? 0,
        audioPositionSeconds: progressRow?.audio_position_seconds ?? 0,
      },
      status: current.lesson.completed ? "concluida" : "nao_iniciada",
      locked,
      lockReason: locked ? "premium" : null,
      prev: index > 0 ? { slug: flat[index - 1]!.lesson.slug, title: flat[index - 1]!.lesson.title } : null,
      next:
        index < flat.length - 1
          ? { slug: flat[index + 1]!.lesson.slug, title: flat[index + 1]!.lesson.title }
          : null,
      totalLessons: view.totalLessons,
      completedLessons: view.completedLessons,
    };
  });

/** Marca a aula como concluída e recalcula o progresso do curso. */
export const completeLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ lessonId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: lesson, error } = await context.supabase
      .from("lessons")
      .select("id, tier, status, module_id, course_modules(course_id, status)")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const mod = lesson
      ? (lesson as unknown as { course_modules?: { course_id: string; status: string } }).course_modules
      : null;
    if (!lesson || lesson.status !== "published" || !mod || mod.status !== "published") {
      throw new Error("Aula não disponível.");
    }

    if (lesson.tier === "premium" && !(await isPremium(context.supabase, context.userId))) {
      throw new Error("Esta aula faz parte do conteúdo Premium.");
    }

    const courseId = mod.course_id;
    const { data: existing } = await context.supabase
      .from("lesson_progress")
      .select("id")
      .eq("user_id", context.userId)
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    const payload = {
      status: "concluida" as const,
      course_id: courseId,
      completed_at: new Date().toISOString(),
    };
    if (existing) {
      const { error: upErr } = await context.supabase
        .from("lesson_progress")
        .update(payload)
        .eq("id", existing.id);
      if (upErr) throw new Error(upErr.message);
    } else {
      const { error: insErr } = await context.supabase
        .from("lesson_progress")
        .insert({ user_id: context.userId, lesson_id: lesson.id, ...payload });
      if (insErr) throw new Error(insErr.message);
    }

    const { data: modules } = await context.supabase
      .from("course_modules")
      .select("id, lessons(id, status)")
      .eq("course_id", courseId)
      .eq("status", "published");
    const lessonIds = (modules ?? []).flatMap((m) =>
      ((m as unknown as { lessons?: { id: string; status: string }[] }).lessons ?? [])
        .filter((l) => l.status === "published")
        .map((l) => l.id),
    );

    return syncCourseProgress(context.supabase, context.userId, courseId, lessonIds, lesson.id);
  });

/**
 * Registra o ponto de estudo do aluno (leitura e áudio) na própria linha de lesson_progress.
 * Simples e idempotente: sempre restrito ao usuário autenticado pela RLS.
 */
export const saveLessonCheckpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        lessonId: z.string().uuid(),
        readPercent: z.number().int().min(0).max(100).optional(),
        audioPositionSeconds: z.number().int().min(0).max(86400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: lesson, error } = await context.supabase
      .from("lessons")
      .select("id, status, course_modules(course_id, status)")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const mod = lesson
      ? (lesson as unknown as { course_modules?: { course_id: string; status: string } })
          .course_modules
      : null;
    if (!lesson || lesson.status !== "published" || !mod || mod.status !== "published") {
      throw new Error("Aula não disponível.");
    }

    const { data: existing } = await context.supabase
      .from("lesson_progress")
      .select("id, status, read_percent, audio_position_seconds")
      .eq("user_id", context.userId)
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    const readPercent = Math.max(data.readPercent ?? 0, existing?.read_percent ?? 0);
    const audioPositionSeconds = data.audioPositionSeconds ?? existing?.audio_position_seconds ?? 0;

    if (existing) {
      const { error: upErr } = await context.supabase
        .from("lesson_progress")
        .update({
          read_percent: readPercent,
          audio_position_seconds: audioPositionSeconds,
          status: existing.status === "concluida" ? existing.status : "em_andamento",
        })
        .eq("id", existing.id);
      if (upErr) throw new Error(upErr.message);
    } else {
      const { error: insErr } = await context.supabase.from("lesson_progress").insert({
        user_id: context.userId,
        lesson_id: lesson.id,
        course_id: mod.course_id,
        status: "em_andamento",
        read_percent: readPercent,
        audio_position_seconds: audioPositionSeconds,
      });
      if (insErr) throw new Error(insErr.message);
    }

    return { readPercent, audioPositionSeconds };
  });
