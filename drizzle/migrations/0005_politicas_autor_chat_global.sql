drop policy if exists "Authors update own global messages" on public.mensagens_globais;
create policy "Authors update own global messages" on public.mensagens_globais
  for update to authenticated
  using (user_id = (select auth.uid()) and public.comunidade_participa())
  with check (user_id = (select auth.uid()));

drop policy if exists "Authors delete own global messages" on public.mensagens_globais;
create policy "Authors delete own global messages" on public.mensagens_globais
  for delete to authenticated
  using (user_id = (select auth.uid()) and public.comunidade_participa());