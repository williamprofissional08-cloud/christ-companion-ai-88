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
        "id, title, summary, order_index, testament, category, book_number, lessons(id, slug, title, summary, duration_minutes, tier, status, order_index, passage, keywords)",
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
        completed: done.has(l.id),
        locked: l.tier === "premium" && !premium,
      }));
    return {
      id: m.id,
      title: m.title,
      summary: m.summary,
      order_index: m.order_index,
      testament: m.testament,
      category: m.category,
      book_number: m.book_number,
      lessons,
      completedLessons: lessons.filter((l) => l.completed).length,
    };
  });

  const flat = built.flatMap((m) => m.lessons);
  const completedLessons = flat.filter((l) => l.completed).length;
  const next = flat.find((l) => !l.completed && !l.locked) ?? flat.find((l) => !l.completed) ?? null;

  return {
    course,
    modules: built,
    totalLessons: flat.length,
    completedLessons,
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
