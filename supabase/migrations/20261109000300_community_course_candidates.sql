-- Allow contributors to nominate a legally shareable resource as a candidate for a future course.
alter table public.community_resources
  add column if not exists course_candidate boolean not null default false;
