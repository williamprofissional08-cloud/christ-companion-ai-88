/**
 * Consultas compartilhadas da área do aluno (Escola Bíblica).
 * Recebem sempre um client Supabase já autenticado (RLS do usuário aplicada).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { percentOf, type CourseView, type StudentModule } from "./lesson-view";

type Client = SupabaseClient<Database>;

export async function isPremium(supabase: Client, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(
    data?.tier === "premium" &&
      (data.status === "active" || data.status === "trialing") &&
      (!data.current_period_end || new Date(data.current_period_end) > new Date()),
  );
}

type RawLesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  duration_minutes: number;
  tier: "free" | "premium";
  status: string;
  order_index: number;
  passage: string | null;
  keywords: string[];
  chapter_id: string | null;
  verse_start: number | null;
  verse_end: number | null;
};

type RawChapter = {
  id: string;
  chapter_number: number;
  title: string;
  total_verses: number | null;
};

/** Estrutura publicada do curso + progresso do usuário. */
export async function loadCourseView(
  supabase: Client,
  userId: string,
  slug: string,
): Promise<CourseView | null> {
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, description, level, tier")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!course) return null;

  const [{ data: modules }, premium] = await Promise.all([
    supabase
      .from("course_modules")
      .select(
        "id, title, summary, order_index, testament, category, book_number, book_chapters(id, chapter_number, title, total_verses), lessons(id, slug, title, summary, duration_minutes, tier, status, order_index, passage, keywords, chapter_id, verse_start, verse_end)",
      )
      .eq("course_id", course.id)
      .eq("status", "published")
      .order("order_index", { ascending: true }),
    isPremium(supabase, userId),
  ]);

  const lessonIds = (modules ?? []).flatMap((m) =>
    ((m as unknown as { lessons?: RawLesson[] }).lessons ?? [])
      .filter((l) => l.status === "published")
      .map((l) => l.id),
  );

  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string; status: string }[] };

  const done = new Set(
    (progress ?? []).filter((p) => p.status === "concluida").map((p) => p.lesson_id),
  );

  const built: StudentModule[] = (modules ?? []).map((m) => {
    const lessons = ((m as unknown as { lessons?: RawLesson[] }).lessons ?? [])
      .filter((l) => l.status === "published")
      .sort((a, b) => a.order_index - b.order_index)
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        summary: l.summary,
        duration_minutes: l.duration_minutes,
        tier: l.tier,
        order_index: l.order_index,
        passage: l.passage,
        keywords: l.keywords ?? [],
        chapter_id: l.chapter_id,
        verse_start: l.verse_start,
        verse_end: l.verse_end,
        completed: done.has(l.id),
        locked: l.tier === "premium" && !premium,
      }));
    const chapters = ((m as unknown as { book_chapters?: RawChapter[] }).book_chapters ?? [])
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((chapter) => {
        const chapterLessons = lessons.filter((lesson) => lesson.chapter_id === chapter.id);
        const completed = chapterLessons.filter((lesson) => lesson.completed).length;
        return {
          ...chapter,
          lessons: chapterLessons,
          status: chapterLessons.length > 0 && completed === chapterLessons.length
            ? "concluido" as const
            : completed > 0
              ? "em_andamento" as const
              : "nao_iniciado" as const,
        };
      });
    return {
      id: m.id,
      title: m.title,
      summary: m.summary,
      order_index: m.order_index,
      testament: m.testament,
      category: m.category,
      book_number: m.book_number,
      lessons,
      chapters,
      completedLessons: lessons.filter((l) => l.completed).length,
    };
  });

  const flat = built.flatMap((m) => m.lessons);
  const completedLessons = flat.filter((l) => l.completed).length;
  const chapters = built.flatMap((module) => module.chapters);
  const completedChapters = chapters.filter((chapter) => chapter.status === "concluido").length;
  const next = flat.find((l) => !l.completed && !l.locked) ?? flat.find((l) => !l.completed) ?? null;

  return {
    course,
    modules: built,
    totalLessons: flat.length,
    completedLessons,
    totalChapters: chapters.length,
    completedChapters,
    percent: percentOf(completedLessons, flat.length),
    nextLessonSlug: next?.slug ?? null,
    isPremium: premium,
  };
}

/** Recalcula course_progress a partir das aulas concluídas. */
export async function syncCourseProgress(
  supabase: Client,
  userId: string,
  courseId: string,
  lessonIds: string[],
  lastLessonId: string,
) {
  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string; status: string }[] };

  const completed = (progress ?? []).filter((p) => p.status === "concluida").length;
  const total = lessonIds.length;

  const { data: existing } = await supabase
    .from("course_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  const payload = {
    completed_lessons: completed,
    total_lessons: total,
    last_lesson_id: lastLessonId,
    completed_at: total > 0 && completed >= total ? new Date().toISOString() : null,
  };

  if (existing) {
    await supabase.from("course_progress").update(payload).eq("id", existing.id);
  } else {
    await supabase
      .from("course_progress")
      .insert({ user_id: userId, course_id: courseId, ...payload });
  }

  return { completed, total, percent: percentOf(completed, total) };
}
