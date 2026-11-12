-- Security hardening: prevent enumerating community profiles with an empty search.
-- Keep the SECURITY DEFINER function because it intentionally returns only public
-- community fields and applies the block relationship filter. Its EXECUTE access
-- remains limited to authenticated users and service_role.

CREATE OR REPLACE FUNCTION public.search_community_members(
  p_search text DEFAULT NULL::text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH search_input AS (
    SELECT btrim(coalesce(p_search, '')) AS term
  )
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.profiles p
  CROSS JOIN search_input s
  WHERE p.id <> auth.uid()
    AND auth.uid() IS NOT NULL
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

REVOKE ALL ON FUNCTION public.search_community_members(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_community_members(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_community_members(text, integer) TO authenticated, service_role;
