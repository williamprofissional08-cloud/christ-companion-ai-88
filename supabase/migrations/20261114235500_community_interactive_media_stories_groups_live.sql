-- Additive, opt-in social features. Apply only after confirming a restorable
-- full backup of the target project. Does not change existing auth or chats.
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS media_path text;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS media_kind text;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS media_seconds integer;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS promo_consent boolean NOT NULL DEFAULT false;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='community_posts_media_kind_valid') THEN
  ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_media_kind_valid
   CHECK ((media_path IS NULL AND media_kind IS NULL AND media_seconds IS NULL)
    OR (media_path IS NOT NULL AND media_kind IN ('image','video')
      AND (media_kind='image' AND media_seconds IS NULL OR media_kind='video' AND media_seconds BETWEEN 1 AND 60)));
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.community_stories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 media_path text NOT NULL UNIQUE,
 media_kind text NOT NULL CHECK (media_kind IN ('image','video')),
 media_seconds integer,
 caption text NOT NULL DEFAULT '' CHECK (char_length(caption)<=240),
 status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
 CONSTRAINT community_story_duration CHECK ((media_kind='image' AND media_seconds IS NULL) OR (media_kind='video' AND media_seconds BETWEEN 1 AND 60)),
 CONSTRAINT community_story_expiration CHECK (expires_at > created_at AND expires_at <= created_at + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS community_stories_recent_idx ON public.community_stories(expires_at DESC) WHERE status='published';

CREATE TABLE IF NOT EXISTS public.community_groups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 75),
 description text NOT NULL DEFAULT '' CHECK (char_length(description)<=240),
 created_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden'))
);
CREATE INDEX IF NOT EXISTS community_groups_recent_idx ON public.community_groups(created_at DESC);
CREATE TABLE IF NOT EXISTS public.community_group_members (
 group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(group_id,user_id)
);
CREATE INDEX IF NOT EXISTS community_group_members_user_idx ON public.community_group_members(user_id);
CREATE TABLE IF NOT EXISTS public.community_group_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_group_messages_recent_idx ON public.community_group_messages(group_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_live_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 90),
 room_name text NOT NULL UNIQUE CHECK (char_length(room_name) BETWEEN 12 AND 90),
 status text NOT NULL DEFAULT 'live' CHECK (status IN ('live','ended')),
 started_at timestamptz NOT NULL DEFAULT now(),
 last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
 ended_at timestamptz
);
CREATE INDEX IF NOT EXISTS community_live_active_idx ON public.community_live_sessions(last_heartbeat_at DESC) WHERE status='live';

ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read active or own community stories" ON public.community_stories
 FOR SELECT TO authenticated USING ((status='published' AND expires_at>now()) OR user_id=(SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "Create own stories" ON public.community_stories
 FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()) AND status='published'
  AND expires_at > now() AND expires_at <= now()+interval '24 hours');
CREATE POLICY "Delete own stories" ON public.community_stories
 FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "Moderate stories" ON public.community_stories
 FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Browse active groups" ON public.community_groups
 FOR SELECT TO authenticated USING (status='active' OR creator_id=(SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "Create own groups" ON public.community_groups
 FOR INSERT TO authenticated WITH CHECK (creator_id=(SELECT auth.uid()) AND status='active');
CREATE POLICY "Edit own groups" ON public.community_groups FOR UPDATE TO authenticated
 USING (creator_id=(SELECT auth.uid()) OR public.is_admin())
 WITH CHECK (creator_id=(SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "Members read own group memberships" ON public.community_group_members
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()) OR EXISTS
  (SELECT 1 FROM public.community_groups g WHERE g.id=group_id AND g.creator_id=(SELECT auth.uid())));
CREATE POLICY "Join public groups" ON public.community_group_members
 FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()) AND EXISTS
  (SELECT 1 FROM public.community_groups g WHERE g.id=group_id AND g.status='active'));
CREATE POLICY "Leave public groups" ON public.community_group_members
 FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY "Members read group messages" ON public.community_group_messages
 FOR SELECT TO authenticated USING (EXISTS
  (SELECT 1 FROM public.community_group_members gm WHERE gm.group_id=group_id AND gm.user_id=(SELECT auth.uid())));
CREATE POLICY "Members send group messages" ON public.community_group_messages
 FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()) AND EXISTS
  (SELECT 1 FROM public.community_group_members gm WHERE gm.group_id=group_id AND gm.user_id=(SELECT auth.uid())));
CREATE POLICY "Authors remove group messages" ON public.community_group_messages
 FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Read active or own live streams" ON public.community_live_sessions
 FOR SELECT TO authenticated USING (
  (status='live' AND last_heartbeat_at>now()-interval '50 seconds')
  OR host_id=(SELECT auth.uid()) OR public.is_admin()
 );
CREATE POLICY "Host can create joined live session" ON public.community_live_sessions
 FOR INSERT TO authenticated WITH CHECK (host_id=(SELECT auth.uid()) AND status='live');
CREATE POLICY "Host can heartbeat and end" ON public.community_live_sessions
 FOR UPDATE TO authenticated USING (host_id=(SELECT auth.uid()))
 WITH CHECK (host_id=(SELECT auth.uid()));
CREATE POLICY "Host can remove session" ON public.community_live_sessions
 FOR DELETE TO authenticated USING (host_id=(SELECT auth.uid()));

GRANT SELECT, INSERT, DELETE, UPDATE ON public.community_stories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_group_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_group_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_live_sessions TO authenticated;

-- Private media; clients receive short-lived signed URLs only for visible posts/stories.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 VALUES ('community-media','community-media',false,50000000,
 ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
 ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community media upload own folder" ON storage.objects
 FOR INSERT TO authenticated WITH CHECK (
  bucket_id='community-media' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
 );
CREATE POLICY "Community media read when permitted" ON storage.objects
 FOR SELECT TO authenticated USING (
  bucket_id='community-media' AND (
   (storage.foldername(name))[1]=(SELECT auth.uid())::text
   OR EXISTS (SELECT 1 FROM public.community_posts p
     WHERE p.media_path=name AND p.status='published')
   OR EXISTS (SELECT 1 FROM public.community_stories s
     WHERE s.media_path=name AND s.status='published' AND s.expires_at>now())
   OR public.is_admin()
  )
 );
CREATE POLICY "Community media delete own folder" ON storage.objects
 FOR DELETE TO authenticated USING (
  bucket_id='community-media' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
 );

-- Realtime events are optional; clients also poll for cross-device updates.
DO $$
DECLARE tab text;
BEGIN
 FOREACH tab IN ARRAY ARRAY['community_stories','community_groups','community_group_messages','community_live_sessions'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
   WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=tab) THEN
   EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',tab);
  END IF;
 END LOOP;
END $$;
