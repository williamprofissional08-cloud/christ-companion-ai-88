-- Comunidade: chat global, mensagens privadas e moderação.
-- profiles já existe no projeto; mantemos display_name/avatar_url/created_at sem duplicar dados.

-- Perfis completos continuam privados. A comunidade usa a view de diretório que
-- expõe somente id, display_name e avatar_url.
drop policy if exists "Public profile directory" on public.profiles;
create policy "Members read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create table if not exists public.mensagens_globais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conteudo text not null check (char_length(conteudo) between 1 and 500),
  criado_em timestamptz not null default now(),
  apagada boolean not null default false
);
create index if not exists mensagens_globais_criado_idx
  on public.mensagens_globais (criado_em desc);
create index if not exists mensagens_globais_user_idx
  on public.mensagens_globais (user_id, criado_em desc);

create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  constraint conversas_distinct_users check (user_a <> user_b),
  constraint conversas_normalized_pair check (user_a < user_b),
  constraint conversas_unique_pair unique (user_a, user_b)
);
create index if not exists conversas_user_a_idx on public.conversas (user_a, criado_em desc);
create index if not exists conversas_user_b_idx on public.conversas (user_b, criado_em desc);

create table if not exists public.mensagens_privadas (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  conteudo text not null check (char_length(conteudo) between 1 and 500),
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_privadas_conversa_idx
  on public.mensagens_privadas (conversa_id, criado_em desc);
create index if not exists mensagens_privadas_remetente_idx
  on public.mensagens_privadas (remetente_id, criado_em desc);
create index if not exists mensagens_privadas_nao_lidas_idx
  on public.mensagens_privadas (conversa_id, lida, remetente_id);

create table if not exists public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  quem_bloqueou uuid not null references auth.users(id) on delete cascade,
  bloqueado uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  constraint bloqueios_distinct_users check (quem_bloqueou <> bloqueado),
  constraint bloqueios_unique_pair unique (quem_bloqueou, bloqueado)
);
create index if not exists bloqueios_bloqueado_idx on public.bloqueios (bloqueado);

create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references auth.users(id) on delete cascade,
  mensagem_id uuid,
  perfil_denunciado_id uuid references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('global', 'privada')),
  motivo text not null check (char_length(motivo) between 5 and 500),
  criado_em timestamptz not null default now(),
  constraint denuncias_single_target check (
    (mensagem_id is not null and perfil_denunciado_id is null)
    or (mensagem_id is null and perfil_denunciado_id is not null and tipo = 'privada')
  )
);
create index if not exists denuncias_criado_idx on public.denuncias (criado_em desc);
create index if not exists denuncias_denunciante_idx on public.denuncias (denunciante_id, criado_em desc);

-- Tabela interna para rate limit compartilhado entre chat global e privado.
-- Sem GRANT para authenticated/anon e sem policies: somente a função de trigger acessa.
create table if not exists public.community_message_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_sent_at timestamptz not null
);
alter table public.community_message_rate_limits enable row level security;
revoke all on public.community_message_rate_limits from anon, authenticated;

create or replace function public.enforce_community_message_rules()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  participant_a uuid;
  participant_b uuid;
  previous_sent timestamptz;
begin
  if actor is null or actor <> case when tg_table_name = 'mensagens_globais' then new.user_id else new.remetente_id end then
    raise exception 'Sessão inválida para enviar mensagem.' using errcode = '42501';
  end if;

  new.conteudo := btrim(regexp_replace(
    regexp_replace(coalesce(new.conteudo, ''), '<[^>]*>', '', 'g'),
    '[[:cntrl:]]', '', 'g'
  ));
  if char_length(new.conteudo) < 1 or char_length(new.conteudo) > 500 then
    raise exception 'A mensagem deve conter de 1 a 500 caracteres.' using errcode = '22023';
  end if;

  if tg_table_name = 'mensagens_privadas' then
    select user_a, user_b into participant_a, participant_b
    from public.conversas where id = new.conversa_id;
    if not found or actor not in (participant_a, participant_b) then
      raise exception 'Você não participa desta conversa.' using errcode = '42501';
    end if;
    if exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = participant_a and b.bloqueado = participant_b)
         or (b.quem_bloqueou = participant_b and b.bloqueado = participant_a)
    ) then
      raise exception 'Não é possível enviar mensagens nesta conversa.' using errcode = '42501';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  select last_sent_at into previous_sent
  from public.community_message_rate_limits
  where user_id = actor for update;

  if previous_sent is not null and previous_sent > now() - interval '2 seconds' then
    raise exception 'Aguarde 2 segundos antes de enviar outra mensagem.' using errcode = 'P0001';
  end if;

  insert into public.community_message_rate_limits (user_id, last_sent_at)
  values (actor, now())
  on conflict (user_id) do update set last_sent_at = excluded.last_sent_at;

  return new;
end;
$$;
revoke all on function public.enforce_community_message_rules() from public, anon, authenticated;

drop trigger if exists mensagens_globais_enforce_rules on public.mensagens_globais;
create trigger mensagens_globais_enforce_rules
before insert on public.mensagens_globais
for each row execute function public.enforce_community_message_rules();

drop trigger if exists mensagens_privadas_enforce_rules on public.mensagens_privadas;
create trigger mensagens_privadas_enforce_rules
before insert on public.mensagens_privadas
for each row execute function public.enforce_community_message_rules();

alter table public.mensagens_globais enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens_privadas enable row level security;
alter table public.bloqueios enable row level security;
alter table public.denuncias enable row level security;

drop policy if exists "Authenticated members read global messages" on public.mensagens_globais;
create policy "Authenticated members read global messages" on public.mensagens_globais
  for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists "Members send own global messages" on public.mensagens_globais;
create policy "Members send own global messages" on public.mensagens_globais
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Authors update own global messages" on public.mensagens_globais;
create policy "Authors update own global messages" on public.mensagens_globais
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "Authors delete own global messages" on public.mensagens_globais;
create policy "Authors delete own global messages" on public.mensagens_globais
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Participants read their conversations" on public.conversas;
create policy "Participants read their conversations" on public.conversas
  for select to authenticated using (
    (select auth.uid()) in (user_a, user_b)
    and not exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = user_a and b.bloqueado = user_b)
         or (b.quem_bloqueou = user_b and b.bloqueado = user_a)
    )
  );
drop policy if exists "Members create conversations without blocks" on public.conversas;
create policy "Members create conversations without blocks" on public.conversas
  for insert to authenticated with check (
    (select auth.uid()) in (user_a, user_b)
    and user_a < user_b
    and not exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = user_a and b.bloqueado = user_b)
         or (b.quem_bloqueou = user_b and b.bloqueado = user_a)
    )
  );

drop policy if exists "Participants read private messages" on public.mensagens_privadas;
create policy "Participants read private messages" on public.mensagens_privadas
  for select to authenticated using (
    exists (
      select 1 from public.conversas c
      where c.id = conversa_id
        and (select auth.uid()) in (c.user_a, c.user_b)
        and not exists (
          select 1 from public.bloqueios b
          where (b.quem_bloqueou = c.user_a and b.bloqueado = c.user_b)
             or (b.quem_bloqueou = c.user_b and b.bloqueado = c.user_a)
        )
    )
  );
drop policy if exists "Participants send private messages" on public.mensagens_privadas;
create policy "Participants send private messages" on public.mensagens_privadas
  for insert to authenticated with check (
    remetente_id = (select auth.uid())
    and exists (
      select 1 from public.conversas c
      where c.id = conversa_id
        and (select auth.uid()) in (c.user_a, c.user_b)
        and not exists (
          select 1 from public.bloqueios b
          where (b.quem_bloqueou = c.user_a and b.bloqueado = c.user_b)
             or (b.quem_bloqueou = c.user_b and b.bloqueado = c.user_a)
        )
    )
  );
drop policy if exists "Receivers mark private messages read" on public.mensagens_privadas;
create policy "Receivers mark private messages read" on public.mensagens_privadas
  for update to authenticated using (
    remetente_id <> (select auth.uid())
    and exists (
      select 1 from public.conversas c
      where c.id = conversa_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
  ) with check (
    remetente_id <> (select auth.uid())
    and exists (
      select 1 from public.conversas c
      where c.id = conversa_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
  );

drop policy if exists "Users read their own blocks" on public.bloqueios;
drop policy if exists "Users see block relationships involving them" on public.bloqueios;
create policy "Users see block relationships involving them" on public.bloqueios
  for select to authenticated using (
    quem_bloqueou = (select auth.uid()) or bloqueado = (select auth.uid())
  );
drop policy if exists "Users create their own blocks" on public.bloqueios;
create policy "Users create their own blocks" on public.bloqueios
  for insert to authenticated with check (
    quem_bloqueou = (select auth.uid()) and bloqueado <> (select auth.uid())
  );
drop policy if exists "Users remove their own blocks" on public.bloqueios;
create policy "Users remove their own blocks" on public.bloqueios
  for delete to authenticated using (quem_bloqueou = (select auth.uid()));

drop policy if exists "Members submit own reports" on public.denuncias;
create policy "Members submit own reports" on public.denuncias
  for insert to authenticated with check (denunciante_id = (select auth.uid()));
drop policy if exists "Only admins read reports" on public.denuncias;
create policy "Only admins read reports" on public.denuncias
  for select to authenticated using (public.is_admin());

grant select, insert, update, delete on public.mensagens_globais to authenticated;
grant select, insert on public.conversas to authenticated;
grant select, insert on public.mensagens_privadas to authenticated;
grant update (lida) on public.mensagens_privadas to authenticated;
grant select, insert, delete on public.bloqueios to authenticated;
grant insert, select on public.denuncias to authenticated;

-- O realtime usa Presence no canal "comunidade" e Postgres Changes nestas duas tabelas.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensagens_globais'
  ) then
    alter publication supabase_realtime add table public.mensagens_globais;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensagens_privadas'
  ) then
    alter publication supabase_realtime add table public.mensagens_privadas;
  end if;
end;
$$;

alter table public.mensagens_globais replica identity full;
alter table public.mensagens_privadas replica identity full;
