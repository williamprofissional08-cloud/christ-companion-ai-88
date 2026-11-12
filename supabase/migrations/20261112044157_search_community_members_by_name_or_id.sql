create or replace function public.search_community_members(
  p_search text default null,
  p_limit integer default 30
)
returns table (
  id uuid,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with search_input as (
    select btrim(coalesce(p_search, '')) as term
  )
  select p.id, p.display_name, p.avatar_url
  from public.profiles p
  cross join search_input s
  where p.id <> auth.uid()
    and auth.uid() is not null
    and (
      s.term = ''
      or (
        char_length(s.term) >= 2
        and position(lower(s.term) in lower(coalesce(p.display_name, ''))) > 0
      )
      or (
        char_length(s.term) >= 6
        and p.id::text like s.term || '%'
      )
    )
    and not exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = auth.uid() and b.bloqueado = p.id)
         or (b.quem_bloqueou = p.id and b.bloqueado = auth.uid())
    )
  order by
    case when s.term <> '' and p.id::text like s.term || '%' then 0 else 1 end,
    p.display_name nulls last,
    p.id
  limit greatest(1, least(coalesce(p_limit, 30), 50));
$$;

revoke all on function public.search_community_members(text, integer) from public, anon;
grant execute on function public.search_community_members(text, integer) to authenticated;
