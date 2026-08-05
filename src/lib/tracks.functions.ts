import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { TrackStepContent } from "./types";

export const getTrackProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("track_progress")
      .select("*")
      .eq("user_id", context.userId)
      .eq("track_slug", data.slug)
      .maybeSingle();
    return row;
  });

export const listTrackProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("track_progress")
      .select("track_slug, completed_steps, updated_at")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveTrackStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z.string().max(80),
        step: z.number().int().min(1).max(200),
        done: z.boolean(),
        checkpoint: z.string().max(4000).optional(),
        review: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("track_progress")
      .select("completed_steps, checkpoints, reviews")
      .eq("user_id", userId)
      .eq("track_slug", data.slug)
      .maybeSingle();
    const steps = new Set<number>(existing.data?.completed_steps ?? []);
    if (data.done) steps.add(data.step);
    else steps.delete(data.step);
    const checkpoints = { ...((existing.data?.checkpoints ?? {}) as Record<string, string>) };
    if (data.checkpoint !== undefined) checkpoints[String(data.step)] = data.checkpoint;
    const reviews = { ...((existing.data?.reviews ?? {}) as Record<string, string>) };
    if (data.review !== undefined) reviews[String(data.step)] = data.review;

    const { error } = await supabase.from("track_progress").upsert(
      {
        user_id: userId,
        track_slug: data.slug,
        completed_steps: [...steps].sort((a, b) => a - b),
        checkpoints,
        reviews,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,track_slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getTrackStepContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().max(80), step: z.number().int().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<TrackStepContent> => {
    const { getTrack, buildSteps } = await import("./content/tracks");
    const track = getTrack(data.slug);
    if (!track) throw new Error("Trilha não encontrada");
    const steps = buildSteps(track);
    const step = steps.find((s) => s.index === data.step);
    if (!step) throw new Error("Etapa não encontrada");

    const cacheKey = `${data.slug}:${data.step}`;
    const cached = await context.supabase
      .from("generated_content")
      .select("content")
      .eq("kind", "track-step")
      .eq("slug", cacheKey)
      .maybeSingle();
    if (cached.data?.content) return cached.data.content as unknown as TrackStepContent;

    const settings = await context.supabase
      .from("user_settings")
      .select("reading_minutes, challenge_type, interests, daily_goal")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { generateTrackStep } = await import("./ai-content.server");
    const content = await generateTrackStep(
      track.title,
      track.theme,
      track.summary,
      track.keyVerse,
      steps.length,
      step,
      settings.data
        ? {
            readingMinutes: settings.data.reading_minutes,
            challengeType: settings.data.challenge_type,
            interests: settings.data.interests,
            dailyGoal: settings.data.daily_goal,
          }
        : undefined,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("generated_content")
      .upsert(
        { kind: "track-step", slug: cacheKey, content: content as never },
        { onConflict: "kind,slug" },
      );
    if (error) console.error("track cache failed", error.message);
    return content;
  });
