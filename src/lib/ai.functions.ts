import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { DevotionalContent, PlanDayContent, SearchContent, StudyContent } from "./types";

export const getDevotional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ day: z.string().max(10) }).parse(input))
  .handler(async ({ data, context }): Promise<DevotionalContent> => {
    const existing = await context.supabase
      .from("devotionals")
      .select("content")
      .eq("user_id", context.userId)
      .eq("day", data.day)
      .maybeSingle();
    if (existing.data?.content) return existing.data.content as unknown as DevotionalContent;

    const settings = await context.supabase
      .from("user_settings")
      .select("reading_minutes, challenge_type, interests, daily_goal")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { generateDevotional } = await import("./ai-content.server");
    const prefs = settings.data
      ? {
          readingMinutes: settings.data.reading_minutes,
          challengeType: settings.data.challenge_type,
          interests: settings.data.interests,
          dailyGoal: settings.data.daily_goal,
        }
      : undefined;

    let content: DevotionalContent;
    try {
      content = await generateDevotional(data.day, prefs);
    } catch (aiError) {
      // IA indisponível (ex.: créditos esgotados): entrega devocional de reserva
      // em vez de deixar a tela sem conteúdo. Não é salvo no banco.
      console.error("devotional AI unavailable", (aiError as Error).message);
      const { fallbackDevotional } = await import("./content/fallback-devotional");
      return fallbackDevotional(data.day);
    }

    const { error } = await context.supabase
      .from("devotionals")
      .upsert(
        { user_id: context.userId, day: data.day, content: content as never },
        { onConflict: "user_id,day" },
      );
    if (error) console.error("devotional save failed", error.message);
    return content;
  });


export const getPlanDayContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().max(80), day: z.number().int().min(1).max(400) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<PlanDayContent> => {
    const { getPlan } = await import("./content/plans");
    const legacyPlan = getPlan(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const managed = await supabaseAdmin.from("managed_content")
      .select("metadata, updated_at, status")
      .eq("kind", "prayer_plan")
      .eq("slug", data.slug)
      .maybeSingle();
    if (managed.error) throw new Error(managed.error.message);
    if (managed.data?.status === "archived") throw new Error("Este plano foi arquivado.");
    const published = managed.data?.status === "published";
    const metadata = published && managed.data?.metadata && typeof managed.data.metadata === "object"
      ? managed.data.metadata as Record<string, unknown> : {};
    const plan = published ? {
      slug: data.slug,
      title: String(metadata["title"] ?? legacyPlan?.title ?? data.slug),
      summary: String(metadata["summary"] ?? legacyPlan?.summary ?? ""),
      keyVerse: String(metadata["keyVerse"] ?? legacyPlan?.keyVerse ?? ""),
      days: Number(metadata["days"] ?? legacyPlan?.days ?? 0),
    } : legacyPlan;
    if (!plan) throw new Error("Plano não encontrado");
    if (data.day > plan.days) throw new Error("Dia fora da duração deste plano");
    const cacheKey = published ? `${data.slug}:${data.day}:v${new Date(managed.data!.updated_at).getTime()}` : `${data.slug}:${data.day}`;
    const cached = await context.supabase
      .from("generated_content")
      .select("content")
      .eq("kind", "plan-day")
      .eq("slug", cacheKey)
      .maybeSingle();
    if (cached.data?.content) return cached.data.content as unknown as PlanDayContent;

    const { generatePlanDay } = await import("./ai-content.server");
    const content = await generatePlanDay(plan.title, plan.summary, plan.keyVerse, plan.days, data.day);
    const { error } = await supabaseAdmin
      .from("generated_content")
      .upsert({ kind: "plan-day", slug: cacheKey, content: content as never }, { onConflict: "kind,slug" });
    if (error) console.error("plan cache failed", error.message);
    return content;
  });

export const getStudyContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(80) }).parse(input))
  .handler(async ({ data, context }): Promise<StudyContent> => {
    const { getStudy } = await import("./content/studies");
    const { CURATED_STUDIES } = await import("./content/curated-studies");
    const legacyStudy = getStudy(data.slug);
    const curated = CURATED_STUDIES[data.slug];

    // Curated studies are the reliable local source. A missing admin secret,
    // unavailable database, or missing managed_content table must not hide them.
    let managedData: {
      metadata: unknown;
      content: unknown;
      updated_at: string | null;
      status: string | null;
    } | null = null;
    let supabaseAdminClient: typeof import("@/integrations/supabase/client.server")["supabaseAdmin"] | null = null;
    try {
      const adminModule = await import("@/integrations/supabase/client.server");
      supabaseAdminClient = adminModule.supabaseAdmin;
      const managed = await supabaseAdminClient.from("managed_content")
        .select("metadata, content, updated_at, status")
        .eq("kind", "study")
        .eq("slug", data.slug)
        .maybeSingle();
      if (managed.error) throw managed.error;
      managedData = managed.data;
    } catch (error) {
      console.error("managed study lookup failed; checking local study content", error);
      if (curated) return curated;
      throw new Error("Não foi possível consultar o conteúdo deste estudo.");
    }

    if (managedData?.status === "archived") throw new Error("Este estudo foi arquivado.");

    // Conteúdo curado e revisado é a fonte canônica dos estudos capítulo a capítulo.
    // Registros publicados antigos em managed_content não podem sobrescrever esses estudos
    // com versões resumidas ou desatualizadas; conteúdo gerenciado continua valendo para
    // estudos que ainda não possuem uma versão curada local.
    if (curated) return curated;

    const published = managedData?.status === "published";
    if (published && managedData?.content) return managedData.content as unknown as StudyContent;
    const metadata = published && managedData?.metadata && typeof managedData.metadata === "object"
      ? managedData.metadata as Record<string, unknown> : {};
    const study = published ? {
      slug: data.slug,
      title: String(metadata["title"] ?? legacyStudy?.title ?? data.slug),
      category: String(metadata["category"] ?? legacyStudy?.category ?? "Estudos bíblicos"),
      reference: String(metadata["reference"] ?? legacyStudy?.reference ?? ""),
      summary: String(metadata["summary"] ?? legacyStudy?.summary ?? ""),
      depth: (metadata["depth"] === "deep" ? "deep" : "simple") as "simple" | "deep",
    } : legacyStudy;
    if (!study) throw new Error("Estudo não encontrado");
    if (curated && (!published || !managedData?.content)) return curated;
    const cacheKey = published ? `${data.slug}:v${new Date(managedData!.updated_at ?? 0).getTime()}` : data.slug;
    const cached = await context.supabase
      .from("generated_content")
      .select("content")
      .eq("kind", "study")
      .eq("slug", cacheKey)
      .maybeSingle();
    if (cached.data?.content) return cached.data.content as unknown as StudyContent;

    const { generateChapterStudy, generateStudy } = await import("./ai-content.server");
    const { getChapterStudy } = await import("./content/bible-books");
    const chapterStudy = getChapterStudy(data.slug);
    const content = chapterStudy
      ? await generateChapterStudy(chapterStudy.book.name, chapterStudy.chapter, chapterStudy.book.category)
      : await generateStudy(study.title, study.reference, study.summary, study.category, study.depth);
    if (!supabaseAdminClient) throw new Error("Supabase admin client unavailable");
    const { error } = await supabaseAdminClient
      .from("generated_content")
      .upsert({ kind: "study", slug: cacheKey, content: content as never }, { onConflict: "kind,slug" });
    if (error) console.error("study cache failed", error.message);
    return content;
  });

export const searchScriptures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(120) }).parse(input))
  .handler(async ({ data }): Promise<SearchContent> => {
    const { generateSearch } = await import("./ai-content.server");
    return generateSearch(data.query);
  });

export const explainReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ reference: z.string().min(2).max(80), text: z.string().max(6000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { explainPassage } = await import("./ai-content.server");
    return explainPassage(data.reference, data.text);
  });
