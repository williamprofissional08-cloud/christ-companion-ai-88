drop policy if exists "Members send friendship requests" on public.pedidos_amizade;
create policy "Members send friendship requests" on public.pedidos_amizade
  for insert to authenticated with check (
    solicitante_id = (select auth.uid())
    and destinatario_id <> (select auth.uid())
    and status = 'pendente'
    and not exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = solicitante_id and b.bloqueado = destinatario_id)
         or (b.quem_bloqueou = destinatario_id and b.bloqueado = solicitante_id)
    )
    and not exists (
      select 1 from public.amizades a
      where a.user_a = least(solicitante_id, destinatario_id)
        and a.user_b = greatest(solicitante_id, destinatario_id)
    )
  );
revoke all on public.pedidos_amizade from anon;
grant select, insert, update on public.pedidos_amizade to authenticated;