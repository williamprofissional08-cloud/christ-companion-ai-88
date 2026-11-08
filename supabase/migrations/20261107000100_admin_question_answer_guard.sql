-- Prevent administrators from deleting quiz questions that already have student answers.
-- The function returns only a boolean and does not expose private answer contents.
CREATE OR REPLACE FUNCTION public.admin_question_has_answers(_question_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.lesson_answers
    WHERE question_id = _question_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_question_has_answers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_question_has_answers(uuid) TO authenticated, service_role;
