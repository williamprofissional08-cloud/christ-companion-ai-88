ALTER TABLE public.lesson_media
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'published';

DO $$ BEGIN
  ALTER TABLE public.lesson_media
    ADD CONSTRAINT lesson_media_kind_check CHECK (kind IN ('audio','video'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS lesson_media_lesson_kind_idx
  ON public.lesson_media (lesson_id, kind, order_index);