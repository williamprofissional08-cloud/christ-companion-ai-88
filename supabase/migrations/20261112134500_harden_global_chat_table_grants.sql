-- Defense in depth for the global community chat.
-- Global messages are intentionally readable by authenticated community members:
-- this is the product's public/global chat, not private-message storage.
-- RLS continues to limit inserts/updates/deletes to each message author.
-- Anonymous visitors do not need direct table access.

REVOKE ALL PRIVILEGES ON TABLE public.mensagens_globais FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.mensagens_globais FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.mensagens_globais
TO authenticated;

-- Explicitly preserve the intended row-level boundaries.
DROP POLICY IF EXISTS "Authenticated members read global messages"
  ON public.mensagens_globais;
CREATE POLICY "Authenticated members read global messages"
  ON public.mensagens_globais
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Members send own global messages"
  ON public.mensagens_globais;
CREATE POLICY "Members send own global messages"
  ON public.mensagens_globais
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authors update own global messages"
  ON public.mensagens_globais;
CREATE POLICY "Authors update own global messages"
  ON public.mensagens_globais
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authors delete own global messages"
  ON public.mensagens_globais;
CREATE POLICY "Authors delete own global messages"
  ON public.mensagens_globais
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Member profiles are already restricted to the authenticated owner's row
-- by the current live database policies. Do not widen profile access here.
