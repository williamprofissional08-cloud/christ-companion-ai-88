ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS reminder_repeat text NOT NULL DEFAULT 'diario',
  ADD COLUMN IF NOT EXISTS reminder_paused_until timestamptz;