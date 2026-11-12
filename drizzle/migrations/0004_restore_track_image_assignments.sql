create table if not exists public.track_image_assignments (
  track_slug text primary key check (length(track_slug) between 1 and 80),
  image_id text not null check (image_id in (
    'paz', 'fe', 'oracao', 'perdao', 'identidade', 'proposito', 'gratidao', 'esperanca'
  )),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.track_image_assignments enable row level security;

grant select on public.track_image_assignments to authenticated;
grant insert, update, delete on public.track_image_assignments to authenticated;

drop policy if exists "Authenticated users read track image assignments" on public.track_image_assignments;
create policy "Authenticated users read track image assignments"
  on public.track_image_assignments
  for select
  to authenticated
  using (true);

drop policy if exists "Admins manage track image assignments" on public.track_image_assignments;
create policy "Admins manage track image assignments"
  on public.track_image_assignments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
