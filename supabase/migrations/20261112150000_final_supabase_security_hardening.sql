-- Final hardening for the currently deployed Supabase schema.
-- This migration is intentionally additive and preserves the product's
-- authenticated global chat and the current RPC contracts.

-- Do not allow an empty search to enumerate every community profile.
CREATE OR REPLACE FUNCTION public.search_community_members(
  p_search text DEFAULT NULL::text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
  WITH search_input AS (
    SELECT btrim(coalesce(p_search, '')) AS term
  )
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.profiles p
  CROSS JOIN search_input s
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND char_length(s.term) >= 2
    AND (
      position(lower(s.term) IN lower(coalesce(p.display_name, ''))) > 0
      OR (
        s.term ~ '^[0-9a-fA-F-]{6,36}$'
        AND p.id::text LIKE lower(s.term) || '%'
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.bloqueios b
      WHERE (b.quem_bloqueou = auth.uid() AND b.bloqueado = p.id)
         OR (b.quem_bloqueou = p.id AND b.bloqueado = auth.uid())
    )
  ORDER BY
    CASE
      WHEN s.term ~ '^[0-9a-fA-F-]{6,36}$'
        AND p.id::text LIKE lower(s.term) || '%' THEN 0
      ELSE 1
    END,
    p.display_name NULLS LAST,
    p.id
  LIMIT greatest(1, least(coalesce(p_limit, 30), 50));
$function$;

REVOKE ALL ON FUNCTION public.search_community_members(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_community_members(text, integer) TO authenticated, service_role;

-- Rate-limit tables are deliberately inaccessible to end-user roles.
-- Explicit service_role policies document the intended server-only access
-- and silence the misleading "RLS enabled without policy" lint finding.
DROP POLICY IF EXISTS "service role manages AI rate limits" ON public.ai_rate_limits;
CREATE POLICY "service role manages AI rate limits"
  ON public.ai_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages community message rate limits" ON public.community_message_rate_limits;
CREATE POLICY "service role manages community message rate limits"
  ON public.community_message_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON TABLE public.ai_rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.community_message_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.ai_rate_limits TO service_role;
GRANT ALL ON TABLE public.community_message_rate_limits TO service_role;

-- SECURITY DEFINER RPCs below are intentional:
-- is_admin() is used by admin UI/RLS; consume_ai_rate_limit() must atomically
-- update a server-only counter; admin_question_has_answers() gates admin actions.
-- They perform their own authorization checks and are not granted to anon/PUBLIC.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_question_has_answers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_question_has_answers(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.is_admin() IS
  'Intentional SECURITY DEFINER RPC: checks the caller role through has_role; no anon/PUBLIC execute.';
COMMENT ON FUNCTION public.consume_ai_rate_limit(text) IS
  'Intentional SECURITY DEFINER RPC: atomically consumes the authenticated caller rate-limit bucket; strict endpoint allowlist; no anon/PUBLIC execute.';
COMMENT ON FUNCTION public.admin_question_has_answers(uuid) IS
  'Intentional SECURITY DEFINER RPC: requires is_admin() before checking answer existence; no anon/PUBLIC execute.';
COMMENT ON FUNCTION public.search_community_members(text, integer) IS
  'Intentional SECURITY DEFINER RPC: requires authenticated caller, min 2-char search, returns only public display fields, excludes blocked relationships, max 50 rows.';
