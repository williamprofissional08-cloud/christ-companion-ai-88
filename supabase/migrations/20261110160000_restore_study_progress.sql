-- Persist reading position for curated biblical studies.
-- Additive only: does not alter or rewrite study content or existing progress.
create table if not exists public.study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_slug text not null check (char_length(study_slug) between 1 and 120),
  read_percent integer not null default 0 check (read_percent between 0 and 100),
  last_section_index integer not null default 0 check (last_section_index between 0 and 10000),
  audio_chunk_index integer not null default 0 check (audio_chunk_index between 0 and 100000),
  playback_rate numeric(3,2) not null default 1.00
    check (playback_rate in (0.75, 1.00, 1.25, 1.50, 1.75, 2.00)),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_progress_user_study_unique unique (user_id, study_slug)
);

alter table public.study_progress enable row level security;

drop policy if exists "Users can read own study progress" on public.study_progress;
create policy "Users can read own study progress"
  on public.study_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own study progress" on public.study_progress;
create policy "Users can insert own study progress"
  on public.study_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own study progress" on public.study_progress;
create policy "Users can update own study progress"
  on public.study_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own study progress" on public.study_progress;
create policy "Users can delete own study progress"
  on public.study_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.study_progress from anon, public;
grant select, insert, update, delete on table public.study_progress to authenticated;

create index if not exists study_progress_user_updated_idx
  on public.study_progress (user_id, updated_at desc);
