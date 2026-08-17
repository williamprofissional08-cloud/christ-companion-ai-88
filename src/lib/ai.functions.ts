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
    const plan = getPlan(data.slug);
    if (!plan) throw new Error("Plano não encontrado");
    const cacheKey = `${data.slug}:${data.day}`;
    const cached = await context.supabase
      .from("generated_content")
      .select("content")
      .eq("kind", "plan-day")
      .eq("slug", cacheKey)
      .maybeSingle();
    if (cached.data?.content) return cached.data.content as unknown as PlanDayContent;

    const { generatePlanDay } = await import("./ai-content.server");
    const content = await generatePlanDay(plan.title, plan.summary, plan.keyVerse, plan.days, data.day);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const study = getStudy(data.slug);
    if (!study) throw new Error("Estudo não encontrado");
    const cached = await context.supabase
      .from("generated_content")
      .select("content")
      .eq("kind", "study")
      .eq("slug", data.slug)
      .maybeSingle();
    if (cached.data?.content) return cached.data.content as unknown as StudyContent;

    const { generateStudy } = await import("./ai-content.server");
    const content = await generateStudy(study.title, study.reference, study.summary, study.category);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("generated_content")
      .upsert({ kind: "study", slug: data.slug, content: content as never }, { onConflict: "kind,slug" });
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

export const readPassage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ reference: z.string().min(2).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { fetchPassage } = await import("./ai-content.server");
    return fetchPassage(data.reference);
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
