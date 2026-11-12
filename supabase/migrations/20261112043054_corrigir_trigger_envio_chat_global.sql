-- Corrige referência a NEW.remetente_id no gatilho compartilhado dos chats.
-- O campo existe em mensagens_privadas, mas não em mensagens_globais.
create or replace function public.enforce_community_message_rules()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  participant_a uuid;
  participant_b uuid;
  previous_sent timestamptz;
begin
  if actor is null then
    raise exception 'Sessão inválida para enviar mensagem.' using errcode = '42501';
  end if;

  -- Separar os campos por tabela: NEW.remetente_id não existe em mensagens_globais.
  if tg_table_name = 'mensagens_globais' then
    if actor <> new.user_id then
      raise exception 'Sessão inválida para enviar mensagem.' using errcode = '42501';
    end if;
  elsif tg_table_name = 'mensagens_privadas' then
    if actor <> new.remetente_id then
      raise exception 'Sessão inválida para enviar mensagem.' using errcode = '42501';
    end if;

    select user_a, user_b into participant_a, participant_b
    from public.conversas where id = new.conversa_id;

    if not found or actor not in (participant_a, participant_b)
      or not exists (
        select 1 from public.amizades a
        where a.user_a = participant_a and a.user_b = participant_b
      ) then
      raise exception 'Conversa privada exige amizade aceita.' using errcode = '42501';
    end if;

    if exists (
      select 1 from public.bloqueios b
      where (b.quem_bloqueou = participant_a and b.bloqueado = participant_b)
         or (b.quem_bloqueou = participant_b and b.bloqueado = participant_a)
    ) then
      raise exception 'Não é possível enviar mensagens nesta conversa.' using errcode = '42501';
    end if;
  else
    raise exception 'Tabela de mensagens não reconhecida.' using errcode = '22023';
  end if;

  new.conteudo := btrim(regexp_replace(
    regexp_replace(coalesce(new.conteudo, ''), '<[^>]*>', '', 'g'),
    '[[:cntrl:]]', '', 'g'
  ));
  if char_length(new.conteudo) < 1 or char_length(new.conteudo) > 500 then
    raise exception 'A mensagem deve conter de 1 a 500 caracteres.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  select last_sent_at into previous_sent
  from public.community_message_rate_limits
  where user_id = actor for update;

  if previous_sent is not null and previous_sent > now() - interval '2 seconds' then
    raise exception 'Aguarde 2 segundos antes de enviar outra mensagem.' using errcode = 'P0001';
  end if;

  insert into public.community_message_rate_limits (user_id, last_sent_at)
  values (actor, now())
  on conflict (user_id) do update set last_sent_at = excluded.last_sent_at;

  return new;
end;
$$;

revoke all on function public.enforce_community_message_rules() from public, anon, authenticated;
