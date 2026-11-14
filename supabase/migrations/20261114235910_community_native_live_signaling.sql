-- Native Caminho Divino WebRTC signaling.
-- Additive migration; apply ONLY after a full restorable backup.
-- Protects sender identities and kicked participants in PostgreSQL, not UI state.
CREATE TABLE IF NOT EXISTS public.community_live_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.community_live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'joined' CHECK (status IN ('joined','left','kicked')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id,user_id)
);
CREATE INDEX IF NOT EXISTS community_live_participants_session_idx
 ON public.community_live_participants(session_id,status);

CREATE TABLE IF NOT EXISTS public.community_live_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.community_live_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('join','offer','answer','candidate','leave')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(payload)='object' AND octet_length(payload::text)<=65536),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id<>receiver_id)
);
CREATE INDEX IF NOT EXISTS community_live_signals_recipient_idx
 ON public.community_live_signals(receiver_id,session_id,created_at DESC);

ALTER TABLE public.community_live_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_live_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Live host and member can view participation" ON public.community_live_participants;
CREATE POLICY "Live host and member can view participation"
 ON public.community_live_participants FOR SELECT TO authenticated
 USING (
  user_id=(select auth.uid()) OR EXISTS (
   SELECT 1 FROM public.community_live_sessions s
   WHERE s.id=session_id AND s.host_id=(select auth.uid())
  )
 );

DROP POLICY IF EXISTS "Members join active lives without approval" ON public.community_live_participants;
CREATE POLICY "Members join active lives without approval"
 ON public.community_live_participants FOR INSERT TO authenticated
 WITH CHECK (
   user_id=(select auth.uid()) AND status='joined'
   AND EXISTS (
     SELECT 1 FROM public.community_live_sessions s
     WHERE s.id=session_id AND s.status='live'
       AND s.last_heartbeat_at>now()-interval '50 seconds'
       AND s.host_id<>(select auth.uid())
   )
 );

DROP POLICY IF EXISTS "Members leave and rejoin except if kicked" ON public.community_live_participants;
CREATE POLICY "Members leave and rejoin except if kicked"
 ON public.community_live_participants FOR UPDATE TO authenticated
 USING (
   user_id=(select auth.uid()) AND status IN ('joined','left')
 )
 WITH CHECK (
   user_id=(select auth.uid()) AND status IN ('joined','left')
   AND EXISTS (
     SELECT 1 FROM public.community_live_sessions s
     WHERE s.id=session_id AND s.status='live'
       AND s.last_heartbeat_at>now()-interval '50 seconds'
   )
 );

DROP POLICY IF EXISTS "Host can remove a live participant" ON public.community_live_participants;
CREATE POLICY "Host can remove a live participant"
 ON public.community_live_participants FOR UPDATE TO authenticated
 USING (
   EXISTS (SELECT 1 FROM public.community_live_sessions s
     WHERE s.id=session_id AND s.host_id=(select auth.uid()))
 )
 WITH CHECK (
   status='kicked' AND EXISTS (SELECT 1 FROM public.community_live_sessions s
     WHERE s.id=session_id AND s.host_id=(select auth.uid()))
 );

DROP POLICY IF EXISTS "Users may read only their own signaling" ON public.community_live_signals;
CREATE POLICY "Users may read only their own signaling"
 ON public.community_live_signals FOR SELECT TO authenticated
 USING (
   sender_id=(select auth.uid()) OR receiver_id=(select auth.uid())
 );

DROP POLICY IF EXISTS "Host and joined participants may signal each other" ON public.community_live_signals;
CREATE POLICY "Host and joined participants may signal each other"
 ON public.community_live_signals FOR INSERT TO authenticated
 WITH CHECK (
  sender_id=(select auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.community_live_sessions s
    WHERE s.id=session_id AND s.status='live'
      AND s.last_heartbeat_at>now()-interval '50 seconds'
      AND (
        (s.host_id=sender_id AND EXISTS (
          SELECT 1 FROM public.community_live_participants p
          WHERE p.session_id=s.id AND p.user_id=receiver_id AND p.status='joined'
        ))
        OR
        (s.host_id=receiver_id AND EXISTS (
          SELECT 1 FROM public.community_live_participants p
          WHERE p.session_id=s.id AND p.user_id=sender_id AND p.status='joined'
        ))
      )
  )
 );

GRANT SELECT,INSERT,UPDATE ON public.community_live_participants TO authenticated;
GRANT SELECT,INSERT ON public.community_live_signals TO authenticated;

-- Listen to authorized, sender-authenticated inserts. RLS is enforced on
-- Postgres Changes according to the receiver's authenticated session.
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
   WHERE pubname='supabase_realtime' AND schemaname='public'
     AND tablename='community_live_signals') THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_live_signals;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
   WHERE pubname='supabase_realtime' AND schemaname='public'
     AND tablename='community_live_participants') THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_live_participants;
 END IF;
END $$;
