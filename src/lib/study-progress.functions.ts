import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getStudy } from "@/lib/content/studies";

const slugSchema = z.object({ slug: z.string().min(1).max(120) });

export const getStudyCheckpoint = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("study_progress")
      .select("read_percent, last_section_index, audio_chunk_index, playback_rate")
      .eq("user_id", context.userId).eq("study_slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    return row ? { readPercent: row.read_percent, lastSectionIndex: row.last_section_index,
      audioChunkIndex: row.audio_chunk_index, playbackRate: row.playback_rate } : null;
  });

export const saveStudyCheckpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => slugSchema.extend({
    readPercent: z.number().int().min(0).max(100),
    lastSectionIndex: z.number().int().min(0).max(10000),
    audioChunkIndex: z.number().int().min(0).max(100000),
    playbackRate: z.number().refine((rate) => [0.75, 1, 1.25, 1.5, 1.75, 2].includes(rate)),
  }).parse(input))
  .handler(async ({ data, context }) => {
    if (!getStudy(data.slug)) throw new Error("Estudo não encontrado.");
    const { error } = await context.supabase.from("study_progress").upsert({
      user_id: context.userId, study_slug: data.slug, read_percent: data.readPercent,
      last_section_index: data.lastSectionIndex, audio_chunk_index: data.audioChunkIndex,
      playback_rate: data.playbackRate, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,study_slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });