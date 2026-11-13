create table if not exists public.comunidade_participantes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  entrou_em timestamptz not null default now()
);

grant select, insert, delete on public.comunidade_participantes to authenticated;
grant all on public.comunidade_participantes to service_role;

alter table public.comunidade_participantes enable row level security;

drop policy if exists "Members read own participation" on public.comunidade_participantes;
create policy "Members read own participation" on public.comunidade_participantes
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Members join community" on public.comunidade_participantes;
create policy "Members join community" on public.comunidade_participantes
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Members leave community" on public.comunidade_participantes;
create policy "Members leave community" on public.comunidade_participantes
  for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.comunidade_participa()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.comunidade_participantes p
    where p.user_id = auth.uid()
  )
$$;

revoke all on function public.comunidade_participa() from public, anon;
grant execute on function public.comunidade_participa() to authenticated;

drop policy if exists "Authenticated members read global messages" on public.mensagens_globais;
create policy "Community participants read global messages" on public.mensagens_globais
  for select to authenticated
  using (public.comunidade_participa() and not apagada);

drop policy if exists "Members send own global messages" on public.mensagens_globais;
create policy "Community participants send own global messages" on public.mensagens_globais
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.comunidade_participa());