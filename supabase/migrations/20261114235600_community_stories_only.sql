-- Minimal additive infrastructure for Community Stories.
-- IMPORTANT: Apply only after verifying a restorable full database backup.
-- This migration does not modify users, existing posts, messages, or friendships.
CREATE TABLE IF NOT EXISTS public.community_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_path text NOT NULL UNIQUE,
  media_kind text NOT NULL CHECK (media_kind IN ('image','video')),
  media_seconds integer,
  caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 240),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CONSTRAINT story_duration_valid CHECK (
    (media_kind='image' AND media_seconds IS NULL) OR
    (media_kind='video' AND media_seconds BETWEEN 1 AND 60)
  ),
  CONSTRAINT story_expires_in_24h CHECK (
    expires_at>created_at AND expires_at<=created_at+interval '24 hours'
  )
);
CREATE INDEX IF NOT EXISTS community_stories_active_idx
  ON public.community_stories(expires_at DESC) WHERE status='published';
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;

-- Keep policies isolated from other community tables.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='community_stories' AND policyname='Story audience sees active stories') THEN
    CREATE POLICY "Story audience sees active stories" ON public.community_stories
      FOR SELECT TO authenticated
      USING ((status='published' AND expires_at>now()) OR user_id=(SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='community_stories' AND policyname='Story author creates own') THEN
    CREATE POLICY "Story author creates own" ON public.community_stories
      FOR INSERT TO authenticated
      WITH CHECK (user_id=(SELECT auth.uid()) AND status='published'
        AND expires_at>now() AND expires_at<=now()+interval '24 hours');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='community_stories' AND policyname='Story author deletes own') THEN
    CREATE POLICY "Story author deletes own" ON public.community_stories
      FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()));
  END IF;
END $$;
GRANT SELECT, INSERT, DELETE ON public.community_stories TO authenticated;

-- Private bucket: only own media and published, unexpired stories can be read.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media', 'community-media', false, 50000000,
  ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage'
    AND tablename='objects' AND policyname='Story owner uploads media') THEN
    CREATE POLICY "Story owner uploads media" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id='community-media'
        AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage'
    AND tablename='objects' AND policyname='Authorized story media reading') THEN
    CREATE POLICY "Authorized story media reading" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id='community-media' AND (
        (storage.foldername(name))[1]=(SELECT auth.uid())::text
        OR EXISTS (SELECT 1 FROM public.community_stories s
          WHERE s.media_path=name AND s.status='published' AND s.expires_at>now())
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage'
    AND tablename='objects' AND policyname='Story owner removes media') THEN
    CREATE POLICY "Story owner removes media" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id='community-media'
        AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public'
      AND tablename='community_stories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_stories;
  END IF;
END $$;
