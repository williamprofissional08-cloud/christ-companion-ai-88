import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { UserSettings } from "./types";

const DEFAULTS = {
  onboarding_completed: false,
  interests: [] as string[],
  daily_goal: null as string | null,
  reminder_time: "07:00",
  reading_minutes: 10,
  challenge_type: "equilibrado",
  reminders_enabled: true,
  timezone: "America/Sao_Paulo",
  reminder_repeat: "diario",
  reminder_paused_until: null as string | null,
};


export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserSettings> => {
    const { data } = await context.supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (data) return data as UserSettings;
    return { user_id: context.userId, ...DEFAULTS };
  });

const settingsSchema = z.object({
  interests: z.array(z.string().max(40)).max(20).optional(),
  daily_goal: z.string().max(200).nullable().optional(),
  reminder_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido")
    .optional(),
  reading_minutes: z.number().int().min(3).max(120).optional(),
  challenge_type: z.string().max(30).optional(),
  reminders_enabled: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
});

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const provided = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    const { error } = await context.supabase.from("user_settings").upsert(
      {
        user_id: context.userId,
        ...DEFAULTS,
        ...provided,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        interests: z.array(z.string().max(40)).min(1).max(20),
        daily_goal: z.string().min(3).max(200),
        reminder_time: z.string().regex(/^\d{2}:\d{2}$/),
        reading_minutes: z.number().int().min(3).max(120),
        challenge_type: z.string().max(30),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_settings").upsert(
      {
        user_id: context.userId,
        ...data,
        reminders_enabled: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
