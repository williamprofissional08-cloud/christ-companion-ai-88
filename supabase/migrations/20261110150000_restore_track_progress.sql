-- Restores persistence for the app's reading tracks and weekly summary.
-- This migration is additive and intentionally excludes biblical study content/progress.
create table if not exists public.track_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_slug text not null check (char_length(track_slug) between 1 and 80),
  completed_steps integer[] not null default '{}'::integer[],
  checkpoints jsonb not null default '{}'::jsonb,
  reviews jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint track_progress_user_track_unique unique (user_id, track_slug)
);

create unique index if not exists track_progress_user_track_unique_idx
  on public.track_progress (user_id, track_slug);

alter table public.track_progress enable row level security;

drop policy if exists "own track_progress" on public.track_progress;
create policy "own track_progress"
  on public.track_progress
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.track_progress from anon, public;
grant select, insert, update, delete on table public.track_progress to authenticated;
