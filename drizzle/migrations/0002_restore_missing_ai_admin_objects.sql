CREATE OR REPLACE FUNCTION public.admin_question_has_answers(_question_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN EXISTS (SELECT 1 FROM public.lesson_answers WHERE question_id = _question_id);
END; $$;
REVOKE ALL ON FUNCTION public.admin_question_has_answers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_question_has_answers(uuid) TO authenticated, service_role;

create table if not exists public.managed_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('study', 'prayer_plan')),
  slug text not null check (length(slug) between 3 and 100),
  metadata jsonb not null default '{}'::jsonb,
  content jsonb,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);
grant select, insert, update on public.managed_content to authenticated;
grant all on public.managed_content to service_role;
create index if not exists managed_content_public_idx on public.managed_content (kind, status, slug);
alter table public.managed_content enable row level security;
drop policy if exists "Published managed content is readable" on public.managed_content;
create policy "Published managed content is readable" on public.managed_content for select to authenticated
  using (status = 'published' or public.is_admin());
drop policy if exists "Admins manage managed content" on public.managed_content;
create policy "Admins manage managed content" on public.managed_content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.ai_rate_limits (
  user_id uuid not null,
  endpoint text not null check (endpoint in ('chat', 'professor_ia', 'professor_tts')),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, endpoint, window_start)
);
grant all on public.ai_rate_limits to service_role;
alter table public.ai_rate_limits enable row level security;
revoke all on table public.ai_rate_limits from public, anon, authenticated;

create or replace function public.consume_ai_rate_limit(p_endpoint text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql security definer set search_path = pg_catalog, public, auth as $$
declare
  v_user_id uuid; v_now timestamptz := clock_timestamp(); v_window_start timestamptz;
  v_request_count integer; v_limit integer; v_window_seconds integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  case p_endpoint
    when 'chat' then v_limit := 20; v_window_seconds := 600;
    when 'professor_ia' then v_limit := 15; v_window_seconds := 600;
    when 'professor_tts' then v_limit := 8; v_window_seconds := 600;
    else raise exception 'Invalid rate limit endpoint' using errcode = '22023';
  end case;
  v_window_start := to_timestamp(floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds);
  delete from public.ai_rate_limits where user_id = v_user_id and window_start < v_window_start;
  insert into public.ai_rate_limits (user_id, endpoint, window_start, request_count)
  values (v_user_id, p_endpoint, v_window_start, 1)
  on conflict (user_id, endpoint, window_start) do update set request_count = public.ai_rate_limits.request_count + 1
  returning request_count into v_request_count;
  return query select v_request_count <= v_limit,
    greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => v_window_seconds) - v_now)))::integer);
end; $$;
revoke all on function public.consume_ai_rate_limit(text) from public, anon;
grant execute on function public.consume_ai_rate_limit(text) to authenticated, service_role;