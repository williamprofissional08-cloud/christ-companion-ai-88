-- Member-to-member conversations are separate from the AI assistant's chat_threads/chat_messages.
create table if not exists public.community_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'group')),
  title text,
  direct_key text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  last_message_preview text,
  last_message_at timestamptz,
  last_message_sender_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint community_conversations_shape check (
    (kind = 'direct' and direct_key is not null and title is null)
    or
    (kind = 'group' and direct_key is null and title is not null and char_length(btrim(title)) between 2 and 80)
  )
);

create unique index if not exists community_conversations_direct_key_uidx
  on public.community_conversations (direct_key) where kind = 'direct';
create index if not exists community_conversations_last_message_idx
  on public.community_conversations (last_message_at desc nulls last, created_at desc);

create table if not exists public.community_conversation_members (
  conversation_id uuid not null references public.community_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists community_conversation_members_user_idx
  on public.community_conversation_members (user_id, last_read_at desc);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.community_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists community_messages_conversation_created_idx
  on public.community_messages (conversation_id, created_at desc);

create or replace function public.is_community_conversation_member(_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $function$
  select auth.uid() is not null
    and exists (
      select 1
      from public.community_conversation_members m
      where m.conversation_id = _conversation_id
        and m.user_id = auth.uid()
    );
$function$;
revoke all on function public.is_community_conversation_member(uuid) from public, anon;
grant execute on function public.is_community_conversation_member(uuid) to authenticated;

create or replace function public.set_community_conversation_preview()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
begin
  update public.community_conversations
  set last_message_preview = left(new.body, 240),
      last_message_at = new.created_at,
      last_message_sender_id = new.sender_id
  where id = new.conversation_id
    and (last_message_at is null or new.created_at >= last_message_at);
  return new;
end;
$function$;
revoke all on function public.set_community_conversation_preview() from public, anon, authenticated;
drop trigger if exists community_message_updates_conversation on public.community_messages;
create trigger community_message_updates_conversation
  after insert on public.community_messages
  for each row execute function public.set_community_conversation_preview();

alter table public.community_conversations enable row level security;
alter table public.community_conversation_members enable row level security;
alter table public.community_messages enable row level security;

revoke all on table public.community_conversations from public, anon, authenticated;
revoke all on table public.community_conversation_members from public, anon, authenticated;
revoke all on table public.community_messages from public, anon, authenticated;
grant select on table public.community_conversations to authenticated;
grant select on table public.community_conversation_members to authenticated;
grant select on table public.community_messages to authenticated;
grant insert (conversation_id, sender_id, body) on table public.community_messages to authenticated;

drop policy if exists community_conversations_member_select on public.community_conversations;
create policy community_conversations_member_select
  on public.community_conversations for select to authenticated
  using (public.is_community_conversation_member(id));

drop policy if exists community_conversation_members_member_select on public.community_conversation_members;
create policy community_conversation_members_member_select
  on public.community_conversation_members for select to authenticated
  using (public.is_community_conversation_member(conversation_id));

drop policy if exists community_conversation_members_own_read_update on public.community_conversation_members;

drop policy if exists community_messages_member_select on public.community_messages;
create policy community_messages_member_select
  on public.community_messages for select to authenticated
  using (public.is_community_conversation_member(conversation_id));

drop policy if exists community_messages_member_insert on public.community_messages;
create policy community_messages_member_insert
  on public.community_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_community_conversation_member(conversation_id));

create or replace function public.mark_community_conversation_read(_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  update public.community_conversation_members
  set last_read_at = now()
  where conversation_id = _conversation_id and user_id = v_caller;
  if not found then
    raise exception 'Conversation not found or access denied' using errcode = '42501';
  end if;
end;
$function$;
revoke all on function public.mark_community_conversation_read(uuid) from public, anon;
grant execute on function public.mark_community_conversation_read(uuid) to authenticated;

create or replace function public.get_or_create_community_direct_conversation(_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_caller uuid := auth.uid();
  v_direct_key text;
  v_conversation_id uuid;
begin
  if v_caller is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if _other_user_id is null or _other_user_id = v_caller then
    raise exception 'Choose another community member' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id = _other_user_id) then
    raise exception 'Community member not found' using errcode = '22023';
  end if;

  v_direct_key := least(v_caller::text, _other_user_id::text)
    || ':' || greatest(v_caller::text, _other_user_id::text);
  insert into public.community_conversations (kind, direct_key, created_by)
  values ('direct', v_direct_key, v_caller)
  on conflict (direct_key) where kind = 'direct' do nothing;

  select c.id into v_conversation_id
  from public.community_conversations c
  where c.kind = 'direct' and c.direct_key = v_direct_key;

  insert into public.community_conversation_members (conversation_id, user_id)
  values (v_conversation_id, v_caller), (v_conversation_id, _other_user_id)
  on conflict (conversation_id, user_id) do nothing;

  return v_conversation_id;
end;
$function$;
revoke all on function public.get_or_create_community_direct_conversation(uuid) from public, anon;
grant execute on function public.get_or_create_community_direct_conversation(uuid) to authenticated;

create or replace function public.create_community_group_conversation(_title text, _member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_caller uuid := auth.uid();
  v_members uuid[];
  v_member_count integer;
  v_conversation_id uuid;
  v_title text := btrim(coalesce(_title, ''));
begin
  if v_caller is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select array_agg(distinct candidate)
  into v_members
  from unnest(coalesce(_member_ids, array[]::uuid[])) as input(candidate)
  where candidate is not null and candidate <> v_caller;
  v_member_count := coalesce(cardinality(v_members), 0);
  if v_member_count < 2 or v_member_count > 49 then
    raise exception 'A group must have 2 to 49 other members' using errcode = '22023';
  end if;
  if char_length(v_title) < 2 or char_length(v_title) > 80 then
    raise exception 'Group title must be 2 to 80 characters' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(v_members) as requested(user_id)
    left join public.profiles p on p.id = requested.user_id
    where p.id is null
  ) then
    raise exception 'Community member not found' using errcode = '22023';
  end if;

  insert into public.community_conversations (kind, title, created_by)
  values ('group', v_title, v_caller)
  returning id into v_conversation_id;

  insert into public.community_conversation_members (conversation_id, user_id)
  select v_conversation_id, requested.user_id
  from unnest(array_prepend(v_caller, v_members)) as requested(user_id);

  return v_conversation_id;
end;
$function$;
revoke all on function public.create_community_group_conversation(text, uuid[]) from public, anon;
grant execute on function public.create_community_group_conversation(text, uuid[]) to authenticated;

create or replace function public.add_community_conversation_members(_conversation_id uuid, _member_ids uuid[])
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_caller uuid := auth.uid();
  v_kind text;
  v_members uuid[];
  v_existing_count integer;
  v_new_count integer;
begin
  if v_caller is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select c.kind into v_kind
  from public.community_conversations c
  where c.id = _conversation_id
  for update;
  if v_kind is null or not public.is_community_conversation_member(_conversation_id) then
    raise exception 'Conversation not found or access denied' using errcode = '42501';
  end if;
  if v_kind <> 'group' then
    raise exception 'Only group conversations can add members' using errcode = '22023';
  end if;

  select array_agg(distinct candidate)
  into v_members
  from unnest(coalesce(_member_ids, array[]::uuid[])) as input(candidate)
  where candidate is not null
    and candidate <> v_caller
    and not exists (
      select 1 from public.community_conversation_members m
      where m.conversation_id = _conversation_id and m.user_id = candidate
    );
  v_new_count := coalesce(cardinality(v_members), 0);
  if v_new_count = 0 then
    raise exception 'Choose at least one new community member' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(v_members) as requested(user_id)
    left join public.profiles p on p.id = requested.user_id
    where p.id is null
  ) then
    raise exception 'Community member not found' using errcode = '22023';
  end if;

  select count(*) into v_existing_count
  from public.community_conversation_members m
  where m.conversation_id = _conversation_id;
  if v_existing_count + v_new_count > 50 then
    raise exception 'A group can have at most 50 members' using errcode = '22023';
  end if;

  insert into public.community_conversation_members (conversation_id, user_id)
  select _conversation_id, requested.user_id
  from unnest(v_members) as requested(user_id)
  on conflict (conversation_id, user_id) do nothing;
end;
$function$;
revoke all on function public.add_community_conversation_members(uuid, uuid[]) from public, anon;
grant execute on function public.add_community_conversation_members(uuid, uuid[]) to authenticated;

-- Realtime is optional in local/test environments; the UI also refetches on focus.
do $publication$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_conversations') then
      execute 'alter publication supabase_realtime add table public.community_conversations';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_conversation_members') then
      execute 'alter publication supabase_realtime add table public.community_conversation_members';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages') then
      execute 'alter publication supabase_realtime add table public.community_messages';
    end if;
  end if;
end;
$publication$;
