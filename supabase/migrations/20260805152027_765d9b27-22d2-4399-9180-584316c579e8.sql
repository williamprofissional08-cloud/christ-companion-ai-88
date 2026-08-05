CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed boolean NOT NULL DEFAULT false,
  interests text[] NOT NULL DEFAULT '{}',
  daily_goal text,
  reminder_time text NOT NULL DEFAULT '07:00',
  reading_minutes integer NOT NULL DEFAULT 10,
  challenge_type text NOT NULL DEFAULT 'equilibrado',
  reminders_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.track_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_slug text NOT NULL,
  completed_steps integer[] NOT NULL DEFAULT '{}',
  checkpoints jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviews jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.track_progress TO authenticated;
GRANT ALL ON public.track_progress TO service_role;
ALTER TABLE public.track_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own track progress" ON public.track_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_track_progress_updated_at BEFORE UPDATE ON public.track_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();