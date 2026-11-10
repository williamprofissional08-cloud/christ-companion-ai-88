-- First publication from each member is held for moderator review.
alter table public.community_posts drop constraint if exists community_posts_status_check;
alter table public.community_posts
  add constraint community_posts_status_check check (status in ('pending','published','hidden'));

create or replace function public.hold_first_community_post_for_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and not exists (
    select 1 from public.community_posts p
    where p.user_id = new.user_id and p.status = 'published'
  ) then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists community_first_post_review on public.community_posts;
create trigger community_first_post_review
before insert on public.community_posts
for each row execute function public.hold_first_community_post_for_review();

drop policy if exists "Members create own community posts" on public.community_posts;
create policy "Members create own community posts" on public.community_posts
for insert to authenticated
with check (user_id = auth.uid() and status in ('pending','published'));

drop policy if exists "Authors and admins update community posts" on public.community_posts;
create policy "Authors and admins update community posts" on public.community_posts
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (public.is_admin() or (user_id = auth.uid() and status in ('pending','published')));
