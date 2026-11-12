-- Rollback companion for 20261112170000_harden_security_and_consolidate_rls.sql.
-- Run only if the migration has been applied and a rollback is required.
BEGIN;

DROP POLICY IF EXISTS "service role manages AI rate limits" ON public.ai_rate_limits;
DROP POLICY IF EXISTS "service role manages community message rate limits" ON public.community_message_rate_limits;

-- Restore the previous SECURITY DEFINER search_path settings and grants.
ALTER FUNCTION public.admin_question_has_answers(uuid) SET search_path = public;
ALTER FUNCTION public.consume_ai_rate_limit(text) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.search_community_members(text, integer) SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_question_has_answers(uuid) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(text) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_community_members(text, integer) TO PUBLIC, anon, authenticated, service_role;

-- Restore the previous member-search behavior.
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
    AND (
      s.term = ''
      OR (
        char_length(s.term) >= 2
        AND position(lower(s.term) IN lower(coalesce(p.display_name, ''))) > 0
      )
      OR (
        s.term ~ '^[0-9a-fA-F-]{6,36}$'
        AND p.id::text LIKE lower(s.term) || '%'
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.bloqueios b
      WHERE (b.quem_bloqueou = auth.uid() AND b.bloqueado = p.id)
         OR (b.quem_bloqueou = p.id AND b.bloqueado = auth.uid())
    )
  ORDER BY
    CASE WHEN s.term ~ '^[0-9a-fA-F-]{6,36}$'
      AND p.id::text LIKE lower(s.term) || '%' THEN 0 ELSE 1 END,
    p.display_name NULLS LAST,
    p.id
  LIMIT greatest(1, least(coalesce(p_limit, 30), 50));
$function$;

-- Remove consolidated policies.
DROP POLICY IF EXISTS "read chapters or administer book chapters" ON public.book_chapters;
DROP POLICY IF EXISTS "admins insert book chapters" ON public.book_chapters;
DROP POLICY IF EXISTS "admins update book chapters" ON public.book_chapters;
DROP POLICY IF EXISTS "admins delete book chapters" ON public.book_chapters;
DROP POLICY IF EXISTS "read modules or administer modules" ON public.course_modules;
DROP POLICY IF EXISTS "admins insert modules" ON public.course_modules;
DROP POLICY IF EXISTS "admins update modules" ON public.course_modules;
DROP POLICY IF EXISTS "admins delete modules" ON public.course_modules;
DROP POLICY IF EXISTS "read own or administer course progress" ON public.course_progress;
DROP POLICY IF EXISTS "insert own course progress" ON public.course_progress;
DROP POLICY IF EXISTS "update own course progress" ON public.course_progress;
DROP POLICY IF EXISTS "delete own course progress" ON public.course_progress;
DROP POLICY IF EXISTS "read courses or administer courses" ON public.courses;
DROP POLICY IF EXISTS "admins insert courses" ON public.courses;
DROP POLICY IF EXISTS "admins update courses" ON public.courses;
DROP POLICY IF EXISTS "admins delete courses" ON public.courses;
DROP POLICY IF EXISTS "read lesson content or administer" ON public.lesson_content;
DROP POLICY IF EXISTS "admins insert lesson content" ON public.lesson_content;
DROP POLICY IF EXISTS "admins update lesson content" ON public.lesson_content;
DROP POLICY IF EXISTS "admins delete lesson content" ON public.lesson_content;
DROP POLICY IF EXISTS "read lesson exercises or administer" ON public.lesson_exercises;
DROP POLICY IF EXISTS "admins insert lesson exercises" ON public.lesson_exercises;
DROP POLICY IF EXISTS "admins update lesson exercises" ON public.lesson_exercises;
DROP POLICY IF EXISTS "admins delete lesson exercises" ON public.lesson_exercises;
DROP POLICY IF EXISTS "read lesson media or administer" ON public.lesson_media;
DROP POLICY IF EXISTS "admins insert lesson media" ON public.lesson_media;
DROP POLICY IF EXISTS "admins update lesson media" ON public.lesson_media;
DROP POLICY IF EXISTS "admins delete lesson media" ON public.lesson_media;
DROP POLICY IF EXISTS "read lesson questions or administer" ON public.lesson_questions;
DROP POLICY IF EXISTS "admins insert lesson questions" ON public.lesson_questions;
DROP POLICY IF EXISTS "admins update lesson questions" ON public.lesson_questions;
DROP POLICY IF EXISTS "admins delete lesson questions" ON public.lesson_questions;
DROP POLICY IF EXISTS "read lessons or administer lessons" ON public.lessons;
DROP POLICY IF EXISTS "admins insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "admins update lessons" ON public.lessons;
DROP POLICY IF EXISTS "admins delete lessons" ON public.lessons;
DROP POLICY IF EXISTS "read published or administer managed content" ON public.managed_content;
DROP POLICY IF EXISTS "admins insert managed content" ON public.managed_content;
DROP POLICY IF EXISTS "admins update managed content" ON public.managed_content;
DROP POLICY IF EXISTS "admins delete managed content" ON public.managed_content;
DROP POLICY IF EXISTS "read own or administer roles" ON public.user_roles;

-- Recreate the exact prior policy predicates and command scope.
CREATE POLICY "admins manage book chapters" ON public.book_chapters FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read chapters of published courses" ON public.book_chapters FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id=m.course_id
    WHERE m.id=book_chapters.module_id AND m.status='published'::public.content_status AND c.status='published'::public.content_status)
);
CREATE POLICY "admins manage modules" ON public.course_modules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read published modules" ON public.course_modules FOR SELECT TO authenticated USING (
  is_published AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id=course_modules.course_id AND c.is_published)
);
CREATE POLICY "own course progress" ON public.course_progress FOR ALL TO authenticated USING ((SELECT auth.uid())=user_id) WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY "admins read progress overview" ON public.course_progress FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read published courses" ON public.courses FOR SELECT TO authenticated USING (is_published);
CREATE POLICY "admins manage lesson content" ON public.lesson_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read lesson content" ON public.lesson_content FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id=lesson_content.lesson_id AND l.is_published));
CREATE POLICY "admins manage lesson exercises" ON public.lesson_exercises FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read published lesson exercises" ON public.lesson_exercises FOR SELECT TO authenticated USING (
  status='published'::public.content_status AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id=lesson_exercises.lesson_id AND l.status='published'::public.content_status)
);
CREATE POLICY "admins manage lesson media" ON public.lesson_media FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read lesson media" ON public.lesson_media FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id=lesson_media.lesson_id AND l.is_published));
CREATE POLICY "admins manage lesson questions" ON public.lesson_questions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read lesson questions" ON public.lesson_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id=lesson_questions.lesson_id AND l.is_published));
CREATE POLICY "admins manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "read published lessons" ON public.lessons FOR SELECT TO authenticated USING (
  is_published AND EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id=m.course_id
    WHERE m.id=lessons.module_id AND m.is_published AND c.is_published)
);
CREATE POLICY "Admins manage managed content" ON public.managed_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Published managed content is readable" ON public.managed_content FOR SELECT TO authenticated USING (status='published'::public.content_status OR public.is_admin());
CREATE POLICY "Members read own profile" ON public.profiles FOR SELECT TO authenticated USING (id=(SELECT auth.uid()));
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);

COMMIT;
