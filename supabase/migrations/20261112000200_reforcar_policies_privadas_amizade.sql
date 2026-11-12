-- Reforça o escopo externo das policies e exige amizade também ao marcar mensagens como lidas.
drop policy if exists "Friends create conversations without blocks" on public.conversas;
create policy "Friends create conversations without blocks" on public.conversas
  for insert to authenticated with check (
    (select auth.uid()) in (public.conversas.user_a, public.conversas.user_b)
    and public.conversas.user_a < public.conversas.user_b
    and exists (select 1 from public.amizades a where a.user_a = public.conversas.user_a and a.user_b = public.conversas.user_b)
    and not exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = public.conversas.user_a and b.bloqueado = public.conversas.user_b)
         or (b.quem_bloqueou = public.conversas.user_b and b.bloqueado = public.conversas.user_a)
    )
  );
drop policy if exists "Friends read their conversations" on public.conversas;
create policy "Friends read their conversations" on public.conversas
  for select to authenticated using (
    (select auth.uid()) in (public.conversas.user_a, public.conversas.user_b)
    and exists (select 1 from public.amizades a where a.user_a = public.conversas.user_a and a.user_b = public.conversas.user_b)
    and not exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = public.conversas.user_a and b.bloqueado = public.conversas.user_b)
         or (b.quem_bloqueou = public.conversas.user_b and b.bloqueado = public.conversas.user_a)
    )
  );
drop policy if exists "Receivers mark private messages read" on public.mensagens_privadas;
create policy "Friends mark received private messages read" on public.mensagens_privadas
  for update to authenticated using (
    remetente_id <> (select auth.uid())
    and exists (
      select 1 from public.conversas c
      join public.amizades a on a.user_a = c.user_a and a.user_b = c.user_b
      where c.id = conversa_id and (select auth.uid()) in (c.user_a, c.user_b)
        and not exists (
          select 1 from public.bloqueios b
          where (b.quem_bloqueou = c.user_a and b.bloqueado = c.user_b)
             or (b.quem_bloqueou = c.user_b and b.bloqueado = c.user_a)
        )
    )
  ) with check (
    lida = true
    and remetente_id <> (select auth.uid())
    and exists (
      select 1 from public.conversas c
      join public.amizades a on a.user_a = c.user_a and a.user_b = c.user_b
      where c.id = conversa_id and (select auth.uid()) in (c.user_a, c.user_b)
        and not exists (
          select 1 from public.bloqueios b
          where (b.quem_bloqueou = c.user_a and b.bloqueado = c.user_b)
             or (b.quem_bloqueou = c.user_b and b.bloqueado = c.user_a)
        )
    )
  );