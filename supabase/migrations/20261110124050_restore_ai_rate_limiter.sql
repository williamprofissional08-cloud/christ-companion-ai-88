-- Restore the server-side AI rate limiter without changing user data or existing application tables.
create table if not exists public.ai_rate_limits (
  user_id uuid not null,
  endpoint text not null check (endpoint in ('chat', 'professor_ia', 'professor_tts')),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, endpoint, window_start)
);

alter table public.ai_rate_limits enable row level security;
revoke all on table public.ai_rate_limits from public, anon, authenticated;

create or replace function public.consume_ai_rate_limit(p_endpoint text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid;
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_request_count integer;
  v_limit integer;
  v_window_seconds integer := 600;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  case p_endpoint
    when 'chat' then v_limit := 20;
    when 'professor_ia' then v_limit := 15;
    when 'professor_tts' then v_limit := 8;
    else raise exception 'Invalid rate limit endpoint' using errcode = '22023';
  end case;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );

  delete from public.ai_rate_limits
  where user_id = v_user_id and window_start < v_window_start;

  insert into public.ai_rate_limits (user_id, endpoint, window_start, request_count)
  values (v_user_id, p_endpoint, v_window_start, 1)
  on conflict (user_id, endpoint, window_start)
  do update set request_count = public.ai_rate_limits.request_count + 1
  returning request_count into v_request_count;

  return query
  select v_request_count <= v_limit,
    greatest(1, ceil(extract(epoch from (
      v_window_start + make_interval(secs => v_window_seconds) - v_now
    )))::integer);
end;
$$;

revoke all on function public.consume_ai_rate_limit(text) from public, anon;
grant execute on function public.consume_ai_rate_limit(text) to authenticated;
