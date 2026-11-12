-- Ensure conversation-list subscriptions receive inserts and updates.
-- Idempotent: safe to apply when the table is already part of supabase_realtime.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversas'
  ) then
    alter publication supabase_realtime add table public.conversas;
  end if;
end
$$;
