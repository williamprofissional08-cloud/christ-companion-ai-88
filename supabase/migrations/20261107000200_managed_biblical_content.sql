-- Managed biblical studies and prayer-plan catalog.
-- Existing TypeScript catalogs remain the fallback until each item is explicitly published.
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

create index if not exists managed_content_public_idx
  on public.managed_content (kind, status, slug);

alter table public.managed_content enable row level security;

drop policy if exists "Published managed content is readable" on public.managed_content;
create policy "Published managed content is readable"
  on public.managed_content for select to authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins manage managed content" on public.managed_content;
create policy "Admins manage managed content"
  on public.managed_content for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.managed_content to authenticated;
grant all on public.managed_content to service_role;
