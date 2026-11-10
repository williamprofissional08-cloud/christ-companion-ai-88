-- Safe, read-only member directory for community author labels.
-- Do not expose profile email addresses or private account metadata to other members.
create or replace view public.community_member_profiles as
select id, display_name, avatar_url
from public.profiles;

grant select on public.community_member_profiles to authenticated;
