-- 1) Lesson completion only via server-validated RPC
CREATE OR REPLACE FUNCTION public.guard_lesson_completion()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.lesson_completion', true) = 'on' OR current_user IN ('service_role','postgres','supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'concluida' OR NEW.completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Lesson completion must use complete_lesson';
    END IF;
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status AND (NEW.status = 'concluida' OR OLD.status = 'concluida') THEN
      RAISE EXCEPTION 'Lesson completion must use complete_lesson';
    END IF;
    IF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
      RAISE EXCEPTION 'Lesson completion must use complete_lesson';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_lesson_completion ON public.lesson_progress;
CREATE TRIGGER guard_lesson_completion BEFORE INSERT OR UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.guard_lesson_completion();

CREATE OR REPLACE FUNCTION public.complete_lesson(_lesson_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _course uuid; _tier access_tier;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT m.course_id, l.tier INTO _course, _tier
  FROM public.lessons l JOIN public.course_modules m ON m.id = l.module_id
  WHERE l.id = _lesson_id AND l.status = 'published' AND m.status = 'published';
  IF _course IS NULL THEN RAISE EXCEPTION 'Lesson not available'; END IF;
  IF _tier = 'premium' AND NOT (public.has_premium(_uid) OR public.has_role(_uid,'admin')) THEN
    RAISE EXCEPTION 'Premium required';
  END IF;
  PERFORM set_config('app.lesson_completion', 'on', true);
  INSERT INTO public.lesson_progress (user_id, lesson_id, course_id, status, completed_at)
  VALUES (_uid, _lesson_id, _course, 'concluida', now())
  ON CONFLICT (user_id, lesson_id) DO UPDATE
    SET status = 'concluida', course_id = EXCLUDED.course_id,
        completed_at = COALESCE(public.lesson_progress.completed_at, now());
  PERFORM set_config('app.lesson_completion', 'off', true);
  RETURN _course;
END $$;
REVOKE ALL ON FUNCTION public.complete_lesson(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_lesson(uuid) TO authenticated;

-- 2) Premium entitlement for lesson materials
DROP POLICY IF EXISTS "read lesson content" ON public.lesson_content;
CREATE POLICY "read lesson content" ON public.lesson_content FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_content.lesson_id AND l.is_published
  AND (l.tier = 'free' OR public.has_premium(auth.uid()) OR public.is_admin())));
DROP POLICY IF EXISTS "read lesson media" ON public.lesson_media;
CREATE POLICY "read lesson media" ON public.lesson_media FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_media.lesson_id AND l.is_published
  AND (l.tier = 'free' OR public.has_premium(auth.uid()) OR public.is_admin())));
DROP POLICY IF EXISTS "read lesson questions" ON public.lesson_questions;
CREATE POLICY "read lesson questions" ON public.lesson_questions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_questions.lesson_id AND l.is_published
  AND (l.tier = 'free' OR public.has_premium(auth.uid()) OR public.is_admin())));

-- 3) generated_content cache is server-only
DROP POLICY IF EXISTS "read generated content" ON public.generated_content;
REVOKE SELECT ON public.generated_content FROM anon, authenticated;