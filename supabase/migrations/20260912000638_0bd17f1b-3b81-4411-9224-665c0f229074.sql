REVOKE ALL ON FUNCTION public.issue_course_certificate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.issue_course_certificate(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.issue_course_certificate(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.issue_course_certificate(uuid) TO service_role;