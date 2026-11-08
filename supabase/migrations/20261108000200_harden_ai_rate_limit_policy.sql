-- Harden the already introduced AI rate limiter.
-- Keep migration 20261108000100 immutable: remove its parameterized overload
-- and enforce fixed per-endpoint limits inside PostgreSQL.
drop function if exists public.consume_ai_rate_limit(text, integer, integer);

create or replace function public.consume_ai_rate_limit(p_endpoint text)
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
  v_limit integer;
  v_window_seconds integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  case p_endpoint
    when 'chat' then
      v_limit := 20;
      v_window_seconds := 600;
    when 'professor_ia' then
      v_limit := 15;
      v_window_seconds := 600;
    when 'professor_tts' then
      v_limit := 8;
      v_window_seconds := 600;
    else
      raise exception 'Invalid rate limit endpoint' using errcode = '22023';
  end case;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );

  -- Remove only this user's expired windows; preserve the active window.
  delete from public.ai_rate_limits
  where user_id = v_user_id
    and window_start < v_window_start;

  -- The unique key and UPSERT make increments atomic under concurrency.
  insert into public.ai_rate_limits (user_id, endpoint, window_start, request_count)
  values (v_user_id, p_endpoint, v_window_start, 1)
  on conflict (user_id, endpoint, window_start)
  do update
    set request_count = public.ai_rate_limits.request_count + 1
  returning request_count into v_request_count;

  return query
  select
    v_request_count <= v_limit,
    greatest(
      1,
      ceil(extract(epoch from (
        v_window_start + make_interval(secs => v_window_seconds) - v_now
      )))::integer
    );
end;
$$;

revoke all on function public.consume_ai_rate_limit(text) from public, anon;
grant execute on function public.consume_ai_rate_limit(text) to authenticated;
