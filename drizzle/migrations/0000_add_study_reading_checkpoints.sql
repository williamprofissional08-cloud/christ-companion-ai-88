ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS last_section_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audio_chunk_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS playback_rate numeric(3,2) NOT NULL DEFAULT 1.00;

ALTER TABLE public.lesson_progress
  ADD CONSTRAINT lesson_progress_last_section_index_check CHECK (last_section_index >= 0),
  ADD CONSTRAINT lesson_progress_audio_chunk_index_check CHECK (audio_chunk_index >= 0),
  ADD CONSTRAINT lesson_progress_playback_rate_check CHECK (playback_rate IN (0.75, 1.00, 1.25, 1.50, 1.75, 2.00));

CREATE TABLE public.study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_slug text NOT NULL,
  read_percent integer NOT NULL DEFAULT 0 CHECK (read_percent BETWEEN 0 AND 100),
  last_section_index integer NOT NULL DEFAULT 0 CHECK (last_section_index >= 0),
  audio_chunk_index integer NOT NULL DEFAULT 0 CHECK (audio_chunk_index >= 0),
  playback_rate numeric(3,2) NOT NULL DEFAULT 1.00 CHECK (playback_rate IN (0.75, 1.00, 1.25, 1.50, 1.75, 2.00)),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, study_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_progress TO authenticated;
GRANT ALL ON public.study_progress TO service_role;

ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own study progress"
ON public.study_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study progress"
ON public.study_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study progress"
ON public.study_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study progress"
ON public.study_progress FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX study_progress_user_updated_idx
ON public.study_progress (user_id, updated_at DESC);