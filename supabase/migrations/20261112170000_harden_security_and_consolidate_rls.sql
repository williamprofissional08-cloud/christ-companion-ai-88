-- Review-only security hardening. Do not apply to production until a
-- complete, restorable Supabase backup has been created and verified.
-- This migration preserves existing authenticated access predicates while
-- merging duplicate permissive SELECT policies. It does not touch user data.
BEGIN;

-- Explicit server-only RLS policies for rate-limit storage.
DROP POLICY IF EXISTS "service role manages AI rate limits" ON public.ai_rate_limits;
CREATE POLICY "service role manages AI rate limits"
  ON public.ai_rate_limits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages community message rate limits" ON public.community_message_rate_limits;
CREATE POLICY "service role manages community message rate limits"
  ON public.community_message_rate_limits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Harden SECURITY DEFINER resolution. All referenced objects in the
-- implementations are schema-qualified; pg_temp is deliberately last.
ALTER FUNCTION public.admin_question_has_answers(uuid)
  SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.consume_ai_rate_limit(text)
  SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.is_admin()
  SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.search_community_members(text, integer)
  SET search_path = pg_catalog, public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_question_has_answers(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consume_ai_rate_limit(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_community_members(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_question_has_answers(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_community_members(text, integer) TO authenticated, service_role;

-- Empty directory searches previously returned the entire member directory.
-- Require at least two characters and retain the existing block exclusion,
-- self-exclusion, output fields and hard 50-row cap.
CREATE OR REPLACE FUNCTION public.search_community_members(
  p_search text DEFAULT NULL::text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
  WITH search_input AS (
    SELECT btrim(coalesce(p_search, '')) AS term
  )
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.profiles AS p
  CROSS JOIN search_input AS s
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
      FROM public.bloqueios AS b
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

-- Consolidate the 12 overlapping permissive SELECT-policy findings.
-- For admin-managed tables, admin write permissions remain unchanged while
-- SELECT is represented by one OR-combined policy.

-- book_chapters
DROP POLICY IF EXISTS "admins manage book chapters" ON public.book_chapters;
DROP POLICY IF EXISTS "read chapters of published courses" ON public.book_chapters;
CREATE POLICY "read chapters or administer book chapters" ON public.book_chapters
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.course_modules AS m
      JOIN public.courses AS c ON c.id = m.course_id
      WHERE m.id = book_chapters.module_id
        AND m.status = 'published'::public.content_status
        AND c.status = 'published'::public.content_status
    )
  );
CREATE POLICY "admins insert book chapters" ON public.book_chapters
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update book chapters" ON public.book_chapters
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete book chapters" ON public.book_chapters
  FOR DELETE TO authenticated USING (public.is_admin());

-- course_modules
DROP POLICY IF EXISTS "admins manage modules" ON public.course_modules;
DROP POLICY IF EXISTS "read published modules" ON public.course_modules;
CREATE POLICY "read modules or administer modules" ON public.course_modules
  FOR SELECT TO authenticated USING (
    public.is_admin() OR (
      is_published AND EXISTS (
        SELECT 1 FROM public.courses AS c
        WHERE c.id = course_modules.course_id AND c.is_published
      )
    )
  );
CREATE POLICY "admins insert modules" ON public.course_modules
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update modules" ON public.course_modules
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete modules" ON public.course_modules
  FOR DELETE TO authenticated USING (public.is_admin());

-- course_progress: own CRUD; administrators retain SELECT-only overview.
DROP POLICY IF EXISTS "own course progress" ON public.course_progress;
DROP POLICY IF EXISTS "admins read progress overview" ON public.course_progress;
CREATE POLICY "read own or administer course progress" ON public.course_progress
  FOR SELECT TO authenticated USING (
    (SELECT auth.uid()) = user_id OR public.is_admin()
  );
CREATE POLICY "insert own course progress" ON public.course_progress
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "update own course progress" ON public.course_progress
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "delete own course progress" ON public.course_progress
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- courses
DROP POLICY IF EXISTS "admins manage courses" ON public.courses;
DROP POLICY IF EXISTS "read published courses" ON public.courses;
CREATE POLICY "read courses or administer courses" ON public.courses
  FOR SELECT TO authenticated USING (public.is_admin() OR is_published);
CREATE POLICY "admins insert courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update courses" ON public.courses
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete courses" ON public.courses
  FOR DELETE TO authenticated USING (public.is_admin());

-- lesson_content
DROP POLICY IF EXISTS "admins manage lesson content" ON public.lesson_content;
DROP POLICY IF EXISTS "read lesson content" ON public.lesson_content;
CREATE POLICY "read lesson content or administer" ON public.lesson_content
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.lessons AS l
      WHERE l.id = lesson_content.lesson_id AND l.is_published
    )
  );
CREATE POLICY "admins insert lesson content" ON public.lesson_content
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update lesson content" ON public.lesson_content
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete lesson content" ON public.lesson_content
  FOR DELETE TO authenticated USING (public.is_admin());

-- lesson_exercises
DROP POLICY IF EXISTS "admins manage lesson exercises" ON public.lesson_exercises;
DROP POLICY IF EXISTS "read published lesson exercises" ON public.lesson_exercises;
CREATE POLICY "read lesson exercises or administer" ON public.lesson_exercises
  FOR SELECT TO authenticated USING (
    public.is_admin() OR (
      status = 'published'::public.content_status AND EXISTS (
        SELECT 1 FROM public.lessons AS l
        WHERE l.id = lesson_exercises.lesson_id
          AND l.status = 'published'::public.content_status
      )
    )
  );
CREATE POLICY "admins insert lesson exercises" ON public.lesson_exercises
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update lesson exercises" ON public.lesson_exercises
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete lesson exercises" ON public.lesson_exercises
  FOR DELETE TO authenticated USING (public.is_admin());

-- lesson_media
DROP POLICY IF EXISTS "admins manage lesson media" ON public.lesson_media;
DROP POLICY IF EXISTS "read lesson media" ON public.lesson_media;
CREATE POLICY "read lesson media or administer" ON public.lesson_media
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.lessons AS l
      WHERE l.id = lesson_media.lesson_id AND l.is_published
    )
  );
CREATE POLICY "admins insert lesson media" ON public.lesson_media
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update lesson media" ON public.lesson_media
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete lesson media" ON public.lesson_media
  FOR DELETE TO authenticated USING (public.is_admin());

-- lesson_questions
DROP POLICY IF EXISTS "admins manage lesson questions" ON public.lesson_questions;
DROP POLICY IF EXISTS "read lesson questions" ON public.lesson_questions;
CREATE POLICY "read lesson questions or administer" ON public.lesson_questions
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.lessons AS l
      WHERE l.id = lesson_questions.lesson_id AND l.is_published
    )
  );
CREATE POLICY "admins insert lesson questions" ON public.lesson_questions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update lesson questions" ON public.lesson_questions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete lesson questions" ON public.lesson_questions
  FOR DELETE TO authenticated USING (public.is_admin());

-- lessons
DROP POLICY IF EXISTS "admins manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "read published lessons" ON public.lessons;
CREATE POLICY "read lessons or administer lessons" ON public.lessons
  FOR SELECT TO authenticated USING (
    public.is_admin() OR (
      is_published AND EXISTS (
        SELECT 1 FROM public.course_modules AS m
        JOIN public.courses AS c ON c.id = m.course_id
        WHERE m.id = lessons.module_id AND m.is_published AND c.is_published
      )
    )
  );
CREATE POLICY "admins insert lessons" ON public.lessons
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update lessons" ON public.lessons
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete lessons" ON public.lessons
  FOR DELETE TO authenticated USING (public.is_admin());

-- managed_content already combines published visibility and admin visibility.
DROP POLICY IF EXISTS "Admins manage managed content" ON public.managed_content;
DROP POLICY IF EXISTS "Published managed content is readable" ON public.managed_content;
CREATE POLICY "read published or administer managed content" ON public.managed_content
  FOR SELECT TO authenticated USING (
    status = 'published'::public.content_status OR public.is_admin()
  );
CREATE POLICY "admins insert managed content" ON public.managed_content
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins update managed content" ON public.managed_content
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins delete managed content" ON public.managed_content
  FOR DELETE TO authenticated USING (public.is_admin());

-- profiles: both existing SELECT predicates were identical; remove only the
-- redundant SELECT-only policy and retain the original own-profile ALL policy.
DROP POLICY IF EXISTS "Members read own profile" ON public.profiles;

-- user_roles: merge own-role and admin-role visibility without changing writes.
DROP POLICY IF EXISTS "admins read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own or administer roles" ON public.user_roles
  FOR SELECT TO authenticated USING (
    public.is_admin() OR (SELECT auth.uid()) = user_id
  );

COMMIT;
