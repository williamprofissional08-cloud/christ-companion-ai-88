ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS testament text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS book_number integer;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS passage text,
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS course_modules_bible_order_idx
  ON public.course_modules (course_id, book_number, order_index);
CREATE INDEX IF NOT EXISTS lessons_keywords_idx
  ON public.lessons USING gin (keywords);

CREATE TABLE public.lesson_reflections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  meditation text NOT NULL DEFAULT '',
  prayer_reflection text NOT NULL DEFAULT '',
  exercise_response text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_reflections TO authenticated;
GRANT ALL ON public.lesson_reflections TO service_role;
ALTER TABLE public.lesson_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lesson reflections" ON public.lesson_reflections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX lesson_reflections_user_lesson_idx
  ON public.lesson_reflections (user_id, lesson_id);
CREATE TRIGGER update_lesson_reflections_updated_at
  BEFORE UPDATE ON public.lesson_reflections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sermon_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  title text NOT NULL,
  scripture_text text NOT NULL DEFAULT '',
  objective text NOT NULL DEFAULT '',
  introduction text NOT NULL DEFAULT '',
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  application text NOT NULL DEFAULT '',
  conclusion text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sermon_messages TO authenticated;
GRANT ALL ON public.sermon_messages TO service_role;
ALTER TABLE public.sermon_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sermon messages" ON public.sermon_messages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX sermon_messages_user_updated_idx
  ON public.sermon_messages (user_id, updated_at DESC);
CREATE INDEX sermon_messages_lesson_idx
  ON public.sermon_messages (lesson_id);
CREATE TRIGGER update_sermon_messages_updated_at
  BEFORE UPDATE ON public.sermon_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.issue_course_certificate(_course_id uuid)
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _total integer;
  _completed integer;
  _student_name text;
  _certificate public.certificates;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT count(*) INTO _total
  FROM public.lessons l
  JOIN public.course_modules m ON m.id = l.module_id
  JOIN public.courses c ON c.id = m.course_id
  WHERE c.id = _course_id
    AND c.status = 'published'
    AND m.status = 'published'
    AND l.status = 'published';

  SELECT count(*) INTO _completed
  FROM public.lesson_progress lp
  WHERE lp.user_id = _user_id
    AND lp.course_id = _course_id
    AND lp.status = 'concluida';

  IF _total = 0 OR _completed < _total THEN
    RAISE EXCEPTION 'Course is not complete';
  END IF;

  SELECT display_name INTO _student_name
  FROM public.profiles
  WHERE id = _user_id;

  INSERT INTO public.certificates (user_id, course_id, student_name)
  VALUES (_user_id, _course_id, _student_name)
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET student_name = COALESCE(EXCLUDED.student_name, public.certificates.student_name)
  RETURNING * INTO _certificate;

  RETURN _certificate;
END;
$$;
GRANT EXECUTE ON FUNCTION public.issue_course_certificate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_course_certificate(uuid) TO service_role;