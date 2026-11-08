-- Persistent, per-user AI rate limiting shared by all application instances.
create table if not exists public.ai_rate_limits (
  user_id uuid not null,
  endpoint text not null
    check (endpoint in ('chat', 'professor_ia', 'professor_tts')),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, endpoint, window_start)
);

alter table public.ai_rate_limits enable row level security;
revoke all on table public.ai_rate_limits from public, anon, authenticated;

create or replace function public.consume_ai_rate_limit(
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid;
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_request_count integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_endpoint is null
     or p_limit is null
     or p_window_seconds is null
     or p_endpoint not in ('chat', 'professor_ia', 'professor_tts')
     or p_limit < 1 or p_limit > 100
     or p_window_seconds < 60 or p_window_seconds > 3600 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  -- Keep only the active window rows for this user to bound table growth.
  delete from public.ai_rate_limits
  where user_id = v_user_id
    and window_start < v_window_start;

  insert into public.ai_rate_limits (user_id, endpoint, window_start, request_count)
  values (v_user_id, p_endpoint, v_window_start, 1)
  on conflict (user_id, endpoint, window_start)
  do update
    set request_count = public.ai_rate_limits.request_count + 1
  returning request_count into v_request_count;

  return query
  select
    v_request_count <= p_limit,
    greatest(
      1,
      ceil(extract(epoch from (
        v_window_start + make_interval(secs => p_window_seconds) - v_now
      )))::integer
    );
end;
$$;

revoke all on function public.consume_ai_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_ai_rate_limit(text, integer, integer) to authenticated;
