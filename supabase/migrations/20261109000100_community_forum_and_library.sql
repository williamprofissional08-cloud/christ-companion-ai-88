-- Community: biblical discussions, prayer, testimonies and a moderated PDF library.
-- All member content is authenticated; uploaded books remain private until reviewed.
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'reflexao'
    check (category in ('pergunta','debate','estudo','testemunho','oracao','reflexao')),
  title text not null check (char_length(title) between 4 and 160),
  body text not null check (char_length(body) between 10 and 8000),
  scripture_reference text check (scripture_reference is null or char_length(scripture_reference) <= 120),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_feed_idx on public.community_posts(status, created_at desc);
create index if not exists community_posts_user_idx on public.community_posts(user_id, created_at desc);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments(post_id, created_at);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);
create index if not exists community_reactions_post_idx on public.community_reactions(post_id);

create table if not exists public.community_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  author text not null check (char_length(author) between 2 and 160),
  description text not null check (char_length(description) between 10 and 2000),
  category text not null default 'estudo' check (category in ('estudo','comentario','teologia','historia','devocional','outro')),
  storage_path text not null unique,
  file_name text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  rights_confirmed boolean not null default false check (rights_confirmed = true),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderation_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists community_resources_status_idx on public.community_resources(status, created_at desc);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  check ((post_id is not null)::int + (comment_id is not null)::int = 1)
);

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_resources enable row level security;
alter table public.community_reports enable row level security;

drop policy if exists "Community members read visible posts" on public.community_posts;
create policy "Community members read visible posts" on public.community_posts
for select to authenticated using (status = 'published' or user_id = auth.uid() or public.is_admin());
drop policy if exists "Members create own community posts" on public.community_posts;
create policy "Members create own community posts" on public.community_posts
for insert to authenticated with check (user_id = auth.uid() and status = 'published');
drop policy if exists "Authors and admins update community posts" on public.community_posts;
create policy "Authors and admins update community posts" on public.community_posts
for update to authenticated using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "Authors and admins delete community posts" on public.community_posts;
create policy "Authors and admins delete community posts" on public.community_posts
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Read comments on visible posts" on public.community_comments;
create policy "Read comments on visible posts" on public.community_comments
for select to authenticated using (
  exists (select 1 from public.community_posts p where p.id = post_id and (p.status = 'published' or p.user_id = auth.uid() or public.is_admin()))
);
drop policy if exists "Members comment on visible posts" on public.community_comments;
create policy "Members comment on visible posts" on public.community_comments
for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published')
);
drop policy if exists "Authors and admins delete comments" on public.community_comments;
create policy "Authors and admins delete comments" on public.community_comments
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Read community reactions" on public.community_reactions;
create policy "Read community reactions" on public.community_reactions for select to authenticated using (true);
drop policy if exists "Members react as themselves" on public.community_reactions;
create policy "Members react as themselves" on public.community_reactions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Members remove own reactions" on public.community_reactions;
create policy "Members remove own reactions" on public.community_reactions for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Read approved or own resources" on public.community_resources;
create policy "Read approved or own resources" on public.community_resources
for select to authenticated using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists "Members submit resources for review" on public.community_resources;
create policy "Members submit resources for review" on public.community_resources
for insert to authenticated with check (
  user_id = auth.uid() and status = 'pending' and rights_confirmed = true and reviewed_by is null and reviewed_at is null
);
drop policy if exists "Admins moderate resources" on public.community_resources;
create policy "Admins moderate resources" on public.community_resources
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Members create reports" on public.community_reports;
create policy "Members create reports" on public.community_reports
for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
drop policy if exists "Reporters and admins read reports" on public.community_reports;
create policy "Reporters and admins read reports" on public.community_reports
for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists "Admins update reports" on public.community_reports;
create policy "Admins update reports" on public.community_reports
for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, delete on public.community_comments to authenticated;
grant select, insert, delete on public.community_reactions to authenticated;
grant select, insert, update on public.community_resources to authenticated;
grant select, insert, update on public.community_reports to authenticated;

-- Private bucket: PDF uploads are only downloadable by their owner, admins,
-- or members after the corresponding resource has been approved.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-library', 'community-library', false, 15728640, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 15728640, allowed_mime_types = array['application/pdf'];

drop policy if exists "Members upload own community PDFs" on storage.objects;
create policy "Members upload own community PDFs" on storage.objects
for insert to authenticated with check (
  bucket_id = 'community-library' and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) = 'pdf'
);
drop policy if exists "Read permitted community PDFs" on storage.objects;
create policy "Read permitted community PDFs" on storage.objects
for select to authenticated using (
  bucket_id = 'community-library' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (
      select 1 from public.community_resources r
      where r.storage_path = name and r.status = 'approved'
    )
  )
);
drop policy if exists "Owners and admins delete community PDFs" on storage.objects;
create policy "Owners and admins delete community PDFs" on storage.objects
for delete to authenticated using (
  bucket_id = 'community-library' and (
    (storage.foldername(name))[1] = auth.uid()::text or public.is_admin()
  )
);
