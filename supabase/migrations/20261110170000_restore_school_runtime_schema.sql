-- Runtime schema restoration for the Bible School. No course or lesson content is seeded.
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
revoke all on function public.update_updated_at_column() from public,anon,authenticated;
grant execute on function public.update_updated_at_column() to service_role;

alter table public.courses add column if not exists status public.content_status not null default 'draft', add column if not exists published_at timestamptz;
alter table public.course_modules add column if not exists status public.content_status not null default 'draft', add column if not exists testament text, add column if not exists category text, add column if not exists book_number integer;
alter table public.lessons add column if not exists status public.content_status not null default 'draft', add column if not exists tts_script text, add column if not exists passage text, add column if not exists keywords text[] not null default '{}', add column if not exists chapter_id uuid, add column if not exists verse_start integer, add column if not exists verse_end integer;
alter table public.lesson_media add column if not exists title text, add column if not exists source text not null default 'manual', add column if not exists voice text, add column if not exists language text not null default 'pt-BR', add column if not exists status public.content_status not null default 'published';
alter table public.lesson_progress add column if not exists audio_position_seconds integer not null default 0, add column if not exists read_percent integer not null default 0, add column if not exists last_section_index integer not null default 0, add column if not exists audio_chunk_index integer not null default 0, add column if not exists playback_rate numeric(3,2) not null default 1.00;

create or replace function public.sync_publish_status()
returns trigger language plpgsql set search_path=public as $$ begin new.is_published:=(new.status='published'::public.content_status); return new; end; $$;
do $$ begin
 if not exists(select 1 from pg_trigger where tgname='sync_courses_status' and tgrelid='public.courses'::regclass) then create trigger sync_courses_status before insert or update on public.courses for each row execute function public.sync_publish_status(); end if;
 if not exists(select 1 from pg_trigger where tgname='sync_course_modules_status' and tgrelid='public.course_modules'::regclass) then create trigger sync_course_modules_status before insert or update on public.course_modules for each row execute function public.sync_publish_status(); end if;
 if not exists(select 1 from pg_trigger where tgname='sync_lessons_status' and tgrelid='public.lessons'::regclass) then create trigger sync_lessons_status before insert or update on public.lessons for each row execute function public.sync_publish_status(); end if;
end $$;
grant select,insert,update,delete on public.courses,public.course_modules,public.lessons,public.lesson_content,public.lesson_questions,public.lesson_media to authenticated;
grant all on public.courses,public.course_modules,public.lessons,public.lesson_content,public.lesson_questions,public.lesson_media to service_role;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='admins manage courses') then create policy "admins manage courses" on public.courses for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='course_modules' and policyname='admins manage modules') then create policy "admins manage modules" on public.course_modules for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='lessons' and policyname='admins manage lessons') then create policy "admins manage lessons" on public.lessons for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='lesson_content' and policyname='admins manage lesson content') then create policy "admins manage lesson content" on public.lesson_content for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='lesson_questions' and policyname='admins manage lesson questions') then create policy "admins manage lesson questions" on public.lesson_questions for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='lesson_media' and policyname='admins manage lesson media') then create policy "admins manage lesson media" on public.lesson_media for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='course_progress' and policyname='admins read progress overview') then create policy "admins read progress overview" on public.course_progress for select to authenticated using(public.is_admin()); end if;
end $$;

create table if not exists public.book_chapters(id uuid primary key default gen_random_uuid(),module_id uuid not null references public.course_modules(id) on delete cascade,chapter_number integer not null check(chapter_number between 1 and 150),title text not null default '',total_verses integer check(total_verses is null or total_verses>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(module_id,chapter_number));
do $$ begin if not exists(select 1 from pg_constraint where conname='lessons_chapter_id_fkey') then alter table public.lessons add constraint lessons_chapter_id_fkey foreign key(chapter_id) references public.book_chapters(id) on delete set null; end if; end $$;
create index if not exists courses_status_order_idx on public.courses(status,order_index);
create index if not exists course_modules_status_order_idx on public.course_modules(course_id,status,order_index);
create index if not exists lessons_status_order_idx on public.lessons(module_id,status,order_index);
create index if not exists course_modules_bible_order_idx on public.course_modules(course_id,book_number,order_index);
create index if not exists lessons_keywords_idx on public.lessons using gin(keywords);
create index if not exists lessons_chapter_order_idx on public.lessons(chapter_id,order_index);
create index if not exists book_chapters_module_order_idx on public.book_chapters(module_id,chapter_number);
alter table public.book_chapters enable row level security;
grant select,insert,update,delete on public.book_chapters to authenticated;
grant all on public.book_chapters to service_role;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='book_chapters' and policyname='admins manage book chapters') then create policy "admins manage book chapters" on public.book_chapters for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='book_chapters' and policyname='read chapters of published courses') then create policy "read chapters of published courses" on public.book_chapters for select to authenticated using(exists(select 1 from public.course_modules m join public.courses c on c.id=m.course_id where m.id=module_id and m.status='published' and c.status='published')); end if;
end $$;

create table if not exists public.lesson_reflections(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,lesson_id uuid not null references public.lessons(id) on delete cascade,meditation text not null default '',prayer_reflection text not null default '',exercise_response text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,lesson_id));
alter table public.lesson_reflections enable row level security;
grant select,insert,update,delete on public.lesson_reflections to authenticated;
grant all on public.lesson_reflections to service_role;
do $$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='lesson_reflections' and policyname='own lesson reflections') then create policy "own lesson reflections" on public.lesson_reflections for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id); end if; end $$;
create index if not exists lesson_reflections_user_lesson_idx on public.lesson_reflections(user_id,lesson_id);

create table if not exists public.sermon_messages(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,course_id uuid references public.courses(id) on delete set null,lesson_id uuid references public.lessons(id) on delete set null,title text not null,scripture_text text not null default '',objective text not null default '',introduction text not null default '',points jsonb not null default '[]'::jsonb,application text not null default '',conclusion text not null default '',notes text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.sermon_messages enable row level security;
grant select,insert,update,delete on public.sermon_messages to authenticated;
grant all on public.sermon_messages to service_role;
do $$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='sermon_messages' and policyname='own sermon messages') then create policy "own sermon messages" on public.sermon_messages for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id); end if; end $$;
create index if not exists sermon_messages_user_updated_idx on public.sermon_messages(user_id,updated_at desc);
create index if not exists sermon_messages_lesson_idx on public.sermon_messages(lesson_id);

create table if not exists public.lesson_exercises(id uuid primary key default gen_random_uuid(),lesson_id uuid not null references public.lessons(id) on delete cascade,kind text not null default 'reflection',title text not null,instructions text not null default '',fields jsonb not null default '[]'::jsonb,status public.content_status not null default 'draft',order_index integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.lesson_exercises enable row level security;
grant select,insert,update,delete on public.lesson_exercises to authenticated;
grant all on public.lesson_exercises to service_role;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='lesson_exercises' and policyname='read published lesson exercises') then create policy "read published lesson exercises" on public.lesson_exercises for select to authenticated using(status='published' and exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published')); end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='lesson_exercises' and policyname='admins manage lesson exercises') then create policy "admins manage lesson exercises" on public.lesson_exercises for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
end $$;

create table if not exists public.exercise_submissions(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,lesson_id uuid not null references public.lessons(id) on delete cascade,exercise_id uuid not null references public.lesson_exercises(id) on delete cascade,answers jsonb not null default '{}'::jsonb,completed boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,exercise_id));
alter table public.exercise_submissions enable row level security;
grant select,insert,update,delete on public.exercise_submissions to authenticated;
grant all on public.exercise_submissions to service_role;
do $$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='exercise_submissions' and policyname='own exercise submissions') then create policy "own exercise submissions" on public.exercise_submissions for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id); end if; end $$;
do $$ declare t text; begin foreach t in array array['book_chapters','lesson_reflections','sermon_messages','lesson_exercises','exercise_submissions'] loop if not exists(select 1 from pg_trigger where tgname='update_'||t||'_updated_at' and tgrelid=('public.'||t)::regclass) then execute format('create trigger %I before update on public.%I for each row execute function public.update_updated_at_column()','update_'||t||'_updated_at',t); end if; end loop; end $$;

-- Bootstrap the sole existing account as project administrator on this recovery.
-- This is intentionally conditional: never promote an account when multiple users exist.
insert into public.user_roles(user_id,role)
select id,'admin'::public.app_role from auth.users
where (select count(*) from auth.users)=1
on conflict(user_id,role) do nothing;

-- Keep SECURITY DEFINER entry points limited to the intended server/authenticated callers.
revoke all on function public.has_premium(uuid) from public,anon;
grant execute on function public.has_premium(uuid) to authenticated,service_role;
revoke all on function public.consume_ai_rate_limit(text) from public,anon,authenticated;
grant execute on function public.consume_ai_rate_limit(text) to service_role;
revoke all on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated,service_role;
revoke all on function public.has_role(uuid,public.app_role) from public,anon;
grant execute on function public.has_role(uuid,public.app_role) to authenticated,service_role;

create or replace function public.admin_question_has_answers(_question_id uuid)
returns boolean language plpgsql stable security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 return exists(select 1 from public.lesson_answers where question_id=_question_id);
end; $$;
revoke all on function public.admin_question_has_answers(uuid) from public,anon;
grant execute on function public.admin_question_has_answers(uuid) to authenticated,service_role;
