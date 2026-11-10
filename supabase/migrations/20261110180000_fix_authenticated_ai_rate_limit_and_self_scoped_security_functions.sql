-- Restore authenticated execution of the fixed, server-enforced AI rate limiter.
-- The RPC derives the caller from auth.uid(); clients cannot choose another user.
REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(text) TO authenticated, service_role;

-- SECURITY DEFINER helpers must only disclose the caller's own role/subscription state.
-- Application callers pass their authenticated user ID; attempts to probe another UUID return false.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT COALESCE(_user_id = auth.uid(), false)
     AND EXISTS (
       SELECT 1
       FROM public.user_roles
       WHERE user_id = _user_id
         AND role = _role
     );
$function$;

CREATE OR REPLACE FUNCTION public.has_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT COALESCE(_user_id = auth.uid(), false)
     AND EXISTS (
       SELECT 1
       FROM public.user_subscriptions s
       WHERE s.user_id = _user_id
         AND s.tier = 'premium'
         AND s.status IN ('active', 'trialing')
         AND (s.current_period_end IS NULL OR s.current_period_end > now())
     );
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_premium(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_premium(uuid) TO authenticated, service_role;

-- Keep rate-limit counters inaccessible through direct table APIs.
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_rate_limits FROM PUBLIC, anon, authenticated;
