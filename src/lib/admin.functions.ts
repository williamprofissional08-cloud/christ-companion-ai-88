import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { assertAdmin, isAdminUser } from "./school/admin-guard";
import type { AdminCourse, AdminLesson, AdminModule, AdminStats } from "./school/admin-types";
import { deduplicateStudies } from "./content/studies";

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

/** Arquiva o curso para preservar módulos, aulas, respostas, progresso e certificados vinculados. */
export const adminArchiveCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("courses")
      .update({ status: "archived", published_at: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, archived: true };
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
      .select("id, course_id, title, summary, order_index, status, testament, category, book_number")
      .eq("course_id", data.id)
      .order("order_index", { ascending: true });

    const moduleIds = (modules ?? []).map((m) => m.id);
    const { data: lessons } = moduleIds.length
      ? await context.supabase
          .from("lessons")
          .select("id, module_id, slug, title, summary, duration_minutes, tier, status, order_index, passage, keywords")
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
        testament: z.string().max(40).nullable().optional(),
        category: z.string().max(80).nullable().optional(),
        book_number: z.number().int().min(1).max(66).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      testament: rest.testament ?? null,
      category: rest.category ?? null,
      book_number: rest.book_number ?? null,
    };
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

/** Arquiva o módulo sem apagar capítulos, aulas ou progresso associado. */
export const adminArchiveModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("course_modules")
      .update({ status: "archived" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, archived: true };
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
        passage: z.string().max(200).nullable().optional(),
        keywords: z.array(z.string().max(80)).max(20).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const payload = { ...rest, passage: rest.passage ?? null };
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

/** Arquiva a aula para preservar conteúdo, respostas, exercícios e progresso dos alunos. */
export const adminArchiveLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("lessons")
      .update({ status: "archived" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, archived: true };
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
    // lesson_answers.question_id uses ON DELETE CASCADE. The SECURITY DEFINER
    // RPC returns only a boolean, so private answers are never exposed to admins.
    const { data: hasAnswers, error: answersError } = await context.supabase.rpc(
      "admin_question_has_answers",
      { _question_id: data.id },
    );
    if (answersError) throw new Error(answersError.message);
    if (hasAnswers) {
      throw new Error(
        "Esta questão já possui respostas de alunos e não pode ser excluída. Mantenha-a para preservar o histórico.",
      );
    }
    const { error } = await context.supabase.from("lesson_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Aula com o contexto de módulo e curso (usado no editor de conteúdo e pelo Professor IA). */
export const adminGetLesson = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: lesson, error } = await context.supabase
      .from("lessons")
      .select(
        "id, module_id, slug, title, summary, duration_minutes, tier, status, order_index, tts_script, passage, keywords",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!lesson) return null;

    const { data: mod } = await context.supabase
      .from("course_modules")
      .select("id, course_id, title, summary, order_index, status")
      .eq("id", lesson.module_id)
      .maybeSingle();

    const { data: course } = mod
      ? await context.supabase
          .from("courses")
          .select("id, slug, title, level, tier, status")
          .eq("id", mod.course_id)
          .maybeSingle()
      : { data: null };

    return { lesson, module: mod ?? null, course: course ?? null };
  });

/** Roteiro de narração da aula (preparado para TTS futuro, sem gerar áudio agora). */
export const adminSaveLessonScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        tts_script: z.string().max(40000).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("lessons")
      .update({ tts_script: data.tts_script?.trim() ? data.tts_script : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Mídias da aula (áudio/vídeo) por URL — sem upload de arquivo nesta etapa. */
export const adminListLessonMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ lesson_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("lesson_media")
      .select(
        "id, lesson_id, kind, provider, url, thumbnail_url, duration_seconds, order_index, source, language, title, status",
      )
      .eq("lesson_id", data.lesson_id)
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSaveLessonMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        lesson_id: z.string().uuid(),
        kind: z.enum(["video", "audio"]),
        provider: z.string().min(2).max(40),
        url: z.string().url().max(2000),
        thumbnail_url: z.string().url().max(2000).nullable().optional(),
        duration_seconds: z.number().int().min(0).max(86400).nullable().optional(),
        title: z.string().max(200).nullable().optional(),
        status: statusEnum,
        order_index: z.number().int().min(0).max(999),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      thumbnail_url: rest.thumbnail_url ?? null,
      duration_seconds: rest.duration_seconds ?? null,
      title: rest.title ?? null,
      source: "url",
    };
    if (id) {
      const { error } = await context.supabase.from("lesson_media").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("lesson_media")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminDeleteLessonMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("lesson_media").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


type ManagedContentKind = "study" | "prayer_plan";
type ManagedContentStatus = "draft" | "published" | "archived";
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
type ManagedContentItem = {
  kind: ManagedContentKind;
  slug: string;
  title: string;
  category: string;
  reference: string;
  summary: string;
  depth?: "simple" | "deep";
  days?: number;
  keyVerse?: string;
  status: ManagedContentStatus | "legacy";
  content: JsonValue | null;
};

const managedKindSchema = z.enum(["study", "prayer_plan"]);
const managedStatusSchema = z.enum(["draft", "published", "archived"]);
const managedStudyContentSchema = z.object({
  version: z.number().optional(),
  depth: z.enum(["simple", "deep"]).optional(),
  intro: z.string(),
  historicalContext: z.string(),
  keyPoints: z.array(z.object({ title: z.string(), text: z.string() })),
  application: z.string(),
  crossReferences: z.array(z.string()),
  questions: z.array(z.string()),
  conclusion: z.string(),
  prayer: z.string(),
  sections: z.array(z.object({
    id: z.string(), title: z.string(), body: z.string(), kind: z.string().optional(),
    scriptureRefs: z.array(z.string()).optional(),
    confidence: z.enum(["high", "probable", "debated", "uncertain"]).optional(),
    collapsible: z.boolean().optional(),
  })).optional(),
});

function normalizeManagedIdentity(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function managedMetadata(value: unknown): Record<string, JsonValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, JsonValue>
    : {};
}

/** Lista o catálogo legado junto com as versões gerenciadas, sem duplicar slugs. */
export const adminListManagedContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedContentItem[]> => {
    await assertAdmin(context.supabase, context.userId);
    const [{ STUDIES }, { PRAYER_PLANS }, { CURATED_STUDIES }, stored] = await Promise.all([
      import("./content/studies"),
      import("./content/plans"),
      import("./content/curated-studies"),
      context.supabase.from("managed_content")
        .select("kind, slug, metadata, content, status")
        .order("kind", { ascending: true })
        .order("slug", { ascending: true }),
    ]);
    if (stored.error) throw new Error(stored.error.message);

    const items = new Map<string, ManagedContentItem>();
    for (const item of STUDIES) {
      items.set(`study:${item.slug}`, {
        kind: "study", slug: item.slug, title: item.title, category: item.category,
        reference: item.reference, summary: item.summary, depth: item.depth,
        status: "legacy", content: (CURATED_STUDIES[item.slug] as JsonValue | undefined) ?? null,
      });
    }
    for (const item of PRAYER_PLANS) {
      items.set(`prayer_plan:${item.slug}`, {
        kind: "prayer_plan", slug: item.slug, title: item.title, category: item.category,
        reference: item.keyVerse, summary: item.summary, days: item.days,
        keyVerse: item.keyVerse, status: "legacy", content: null,
      });
    }
    for (const row of stored.data ?? []) {
      const metadata = managedMetadata(row.metadata);
      const key = `${row.kind}:${row.slug}`;
      const previous = items.get(key);
      items.set(key, {
        kind: row.kind as ManagedContentKind,
        slug: row.slug,
        title: String(metadata["title"] ?? previous?.title ?? row.slug),
        category: String(metadata["category"] ?? previous?.category ?? ""),
        reference: String(metadata["reference"] ?? previous?.reference ?? ""),
        summary: String(metadata["summary"] ?? previous?.summary ?? ""),
        ...(metadata["depth"] === "deep" || metadata["depth"] === "simple" ? { depth: metadata["depth"] } : {}),
        ...(typeof metadata["days"] === "number" ? { days: metadata["days"] } : {}),
        ...(typeof metadata["keyVerse"] === "string" ? { keyVerse: metadata["keyVerse"] } : {}),
        status: row.status as ManagedContentStatus,
        content: row.content as JsonValue | null,
      });
    }
    const all = [...items.values()];
    const studies = deduplicateStudies(all.filter((item) => item.kind === "study"));
    const plans = all.filter((item) => item.kind === "prayer_plan");
    return [...studies, ...plans].sort((a, b) =>
      a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title, "pt-BR"),
    );
  });

/** Salva rascunhos/publicações. A autorização é conferida no servidor em cada chamada. */
export const adminSaveManagedContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      kind: managedKindSchema,
      slug: z.string().min(3).max(80).regex(/^[\p{L}\p{N}-]+$/u),
      title: z.string().min(3).max(160),
      category: z.string().min(2).max(80),
      reference: z.string().max(200).default(""),
      summary: z.string().min(1).max(2000),
      depth: z.enum(["simple", "deep"]).optional(),
      days: z.number().int().min(1).max(400).optional(),
      keyVerse: z.string().max(160).optional(),
      status: managedStatusSchema,
      content: managedStudyContentSchema.nullable().optional(),
    }).superRefine((value, ctx) => {
      if (value.kind === "prayer_plan" && (!value.days || !value.keyVerse)) {
        ctx.addIssue({ code: "custom", message: "Planos precisam informar duração e versículo-chave.", path: ["days"] });
      }

    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // Mesmo título + mesma referência identificam o mesmo estudo/plano:
    // mantém o slug escolhido e arquiva as cópias, sem apagar seu conteúdo.
    const { data: existingItems, error: lookupError } = await context.supabase
      .from("managed_content")
      .select("slug, metadata")
      .eq("kind", data.kind)
      .neq("slug", data.slug);
    if (lookupError) throw new Error(lookupError.message);
    const duplicateSlugs = (existingItems ?? []).filter((item) => {
      const metadata = managedMetadata(item.metadata);
      return normalizeManagedIdentity(String(metadata["title"] ?? "")) === normalizeManagedIdentity(data.title) &&
        normalizeManagedIdentity(String(metadata["reference"] ?? "")) === normalizeManagedIdentity(data.reference);
    }).map((item) => item.slug);
    if (duplicateSlugs.length) {
      const { error: archiveError } = await context.supabase
        .from("managed_content")
        .update({ status: "archived" })
        .eq("kind", data.kind)
        .in("slug", duplicateSlugs);
      if (archiveError) throw new Error(archiveError.message);
    }
    const { error } = await context.supabase.from("managed_content").upsert({
      kind: data.kind,
      slug: data.slug,
      metadata: {
        title: data.title,
        category: data.category,
        reference: data.reference,
        summary: data.summary,
        ...(data.depth ? { depth: data.depth } : {}),
        ...(data.days ? { days: data.days } : {}),
        ...(data.keyVerse ? { keyVerse: data.keyVerse } : {}),
      },
      content: data.content ?? null,
      status: data.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: "kind,slug" });
    if (error) throw new Error(error.message);
    return { ok: true, slug: data.slug, status: data.status };
  });

type ManagedCatalogItem = {
  slug: string;
  status: ManagedContentStatus;
  metadata: Record<string, JsonValue>;
  content: JsonValue | null;
};

/** Catálogo publicado para as telas dos alunos; itens legados continuam como fallback local. */
export const getPublishedManagedCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ kind: managedKindSchema }).parse(input))
  .handler(async ({ data, context }): Promise<ManagedCatalogItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("managed_content")
      .select("slug, metadata, content, status")
      .eq("kind", data.kind)
      .in("status", ["published", "archived"]);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row) => ({
      slug: row.slug,
      status: row.status as ManagedContentStatus,
      metadata: row.status === "published" ? managedMetadata(row.metadata) : {},
      content: row.status === "published" ? (row.content as JsonValue | null) : null,
    }));
  });

