# Persistência de trilhas — reconciliação pendente

A aplicação consulta `public.track_progress` em `getWeeklySummary`, mas a tabela não existe no schema Supabase verificado em 10/11/2026. Isso faz a seção de trilhas do resumo semanal ficar incorretamente vazia.

## Correção preparada

- Migration aditiva `20261110150000_restore_track_progress.sql`.
- Chave única `(user_id, track_slug)`, necessária ao upsert do runtime.
- Colunas compatíveis com os tipos gerados e com o código de trilhas.
- RLS habilitada; cada usuário só pode ler e alterar sua própria linha.
- Acesso direto revogado de `anon` e `public`; DML concedido a `authenticated`.
- Leitura de dados passou a falhar explicitamente em caso de erro, em vez de transformar falhas de banco em progresso vazio ou sobrescrever dados com valores incompletos.

## Aplicação bloqueada por segurança operacional

**Não aplicar esta migration em produção ainda.** O histórico remoto do Supabase contém versões `20261110...` criadas fora da árvore atual de migrations do repositório. Antes de qualquer DDL, é necessário produzir backup abrangente, testar restauração isolada e reconciliar formalmente o histórico. Não executar `supabase db push` cegamente: ele pode tentar reaplicar migrations antigas que não estão registradas no histórico remoto.

A migration foi colocada no repositório como proposta revisável, com teste automatizado de suas garantias. Não houve alteração no banco, criação de usuários, deploy ou publicação.
