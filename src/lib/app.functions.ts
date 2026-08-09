import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { DevotionalContent } from "./types";


const daySchema = z.object({ day: z.string() });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => daySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [devotional, habits, goals, plans, journal, streakRows] = await Promise.all([
      supabase.from("devotionals").select("content").eq("user_id", userId).eq("day", data.day).maybeSingle(),
      supabase.from("habit_days").select("habits").eq("user_id", userId).eq("day", data.day).maybeSingle(),
      supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("plan_progress").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("journal_entries").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("habit_days").select("day, habits").eq("user_id", userId).order("day", { ascending: false }).limit(30),
    ]);
    return {
      devotional: (devotional.data?.content ?? null) as DevotionalContent | null,
      habits: (habits.data?.habits ?? {}) as Record<string, boolean>,
      goals: goals.data ?? [],
      plans: plans.data ?? [],
      journal: journal.data ?? [],
      history: (streakRows.data ?? []) as { day: string; habits: Record<string, boolean> }[],
    };
  });

export const toggleHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ day: z.string(), key: z.string(), value: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("habit_days")
      .select("habits")
      .eq("user_id", userId)
      .eq("day", data.day)
      .maybeSingle();
    const habits = { ...((existing.data?.habits ?? {}) as Record<string, boolean>), [data.key]: data.value };
    const { error } = await supabase
      .from("habit_days")
      .upsert(
        { user_id: userId, day: data.day, habits, updated_at: new Date().toISOString() },
        { onConflict: "user_id,day" },
      );
    if (error) throw new Error(error.message);
    return { habits };
  });

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("goals")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ title: z.string().min(2).max(120), target: z.number().int().min(1).max(10000), unit: z.string().max(30).optional() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("goals").insert({
      user_id: context.userId,
      title: data.title,
      target: data.target,
      unit: data.unit ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), progress: z.number().int().min(0).max(100000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const goal = await context.supabase
      .from("goals")
      .select("target")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!goal.data) throw new Error("Meta não encontrada");
    const progress = Math.min(data.progress, goal.data.target);
    const { error } = await context.supabase
      .from("goals")
      .update({ progress, completed: progress >= goal.data.target })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("goals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listJournal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: z.string().max(30),
        title: z.string().min(2).max(160),
        content: z.string().max(8000).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("journal_entries").insert({
      user_id: context.userId,
      kind: data.kind,
      title: data.title,
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setJournalAnswered = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), answered: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("journal_entries")
      .update({ answered: data.answered })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("journal_entries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const addFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: z.string().max(30),
        reference: z.string().max(200),
        content: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("favorites").insert({
      user_id: context.userId,
      kind: data.kind,
      reference: data.reference,
      content: data.content ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("favorites")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPlanProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("plan_progress")
      .select("*")
      .eq("user_id", context.userId)
      .eq("plan_slug", data.slug)
      .maybeSingle();
    return row;
  });

export const savePlanDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z.string().max(80),
        day: z.number().int().min(1).max(400),
        done: z.boolean(),
        note: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("plan_progress")
      .select("completed_days, notes")
      .eq("user_id", userId)
      .eq("plan_slug", data.slug)
      .maybeSingle();
    const current = new Set<number>(existing.data?.completed_days ?? []);
    if (data.done) current.add(data.day);
    else current.delete(data.day);
    const notes = { ...((existing.data?.notes ?? {}) as Record<string, string>) };
    if (data.note !== undefined) notes[String(data.day)] = data.note;
    const { error } = await supabase.from("plan_progress").upsert(
      {
        user_id: userId,
        plan_slug: data.slug,
        completed_days: [...current].sort((a, b) => a - b),
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,plan_slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getWeeklySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => daySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const end = new Date(`${data.day}T00:00:00`);
    const start = new Date(end.getTime() - 6 * 86400000);
    const startISO = start.toISOString().slice(0, 10);

    const [habitRows, journalRows, goals, trackRows] = await Promise.all([
      supabase
        .from("habit_days")
        .select("day, habits")
        .eq("user_id", userId)
        .gte("day", startISO)
        .lte("day", data.day),
      supabase
        .from("journal_entries")
        .select("id, created_at")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString()),
      supabase.from("goals").select("completed").eq("user_id", userId),
      supabase
        .from("track_progress")
        .select("track_slug, completed_steps, updated_at")
        .eq("user_id", userId),
    ]);

    const byDay = new Map<string, Record<string, boolean>>();
    for (const row of habitRows.data ?? [])
      byDay.set(row.day, (row.habits ?? {}) as Record<string, boolean>);

    const days = Array.from({ length: 7 }, (_, index) => {
      const cursor = new Date(start.getTime() + index * 86400000);
      const iso = cursor.toISOString().slice(0, 10);
      const habits = byDay.get(iso) ?? {};
      return { day: iso, done: Object.values(habits).filter(Boolean).length };
    });

    const { READING_TRACKS, buildSteps } = await import("./content/tracks");
    const tracks = (trackRows.data ?? []).map((row) => {
      const track = READING_TRACKS.find((t) => t.slug === row.track_slug);
      const total = track ? buildSteps(track).length : 0;
      const completed = (row.completed_steps ?? []).length;
      return {
        slug: row.track_slug,
        title: track?.title ?? row.track_slug,
        completed,
        total,
        percent: total ? Math.round((completed / total) * 100) : 0,
        updatedAt: row.updated_at,
      };
    });

    return {
      days,
      habitTotal: days.reduce((sum, d) => sum + d.done, 0),
      activeDays: days.filter((d) => d.done > 0).length,
      journalCount: journalRows.data?.length ?? 0,
      goalsCompleted: (goals.data ?? []).filter((g) => g.completed).length,
      goalsTotal: goals.data?.length ?? 0,
      tracks: tracks.sort((a, b) => b.percent - a.percent),
      tracksCompleted: tracks.filter((t) => t.total > 0 && t.completed >= t.total).length,
    };
  });

