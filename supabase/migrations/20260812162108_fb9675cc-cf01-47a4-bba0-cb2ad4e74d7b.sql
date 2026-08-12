REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon, public;
REVOKE ALL ON FUNCTION public.grant_bootstrap_admin() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.sync_publish_status() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;