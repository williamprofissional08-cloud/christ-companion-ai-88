REVOKE ALL ON FUNCTION public.has_premium(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_premium(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_premium(uuid) TO authenticated, service_role;