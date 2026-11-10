# Auditoria de reconciliação — 10/11/2026

## Escopo e segurança

Auditoria somente leitura do projeto Supabase `uluumebztnrgpyzohqrv` e do repositório `williamprofissional08-cloud/christ-companion-ai-88`. Nenhum dado, usuário, política, bucket, função ou schema foi alterado. Nenhuma migração foi aplicada e nenhum deploy foi executado.

## Divergência confirmada

- O repositório contém **29 arquivos SQL** em `supabase/migrations/`.
- O histórico retornado pelo Supabase contém **14 migrações**: `20261110062028`, `20261110062313`, `20261110062328`, `20261110093720`, `20261110093905`, `20261110095325`, `20261110095329`, `20261110095338`, `20261110095341`, `20261110095343`, `20261110095358`, `20261110095416`, `20261110100105` e `20261110100311`. Todas são posteriores às versões `20261107...`/`20261108...` do repositório; portanto, não se deve executar `db push` sem reconciliação explícita da ordem e do estado.
- O schema conectado contém **17 tabelas públicas**; o código TypeScript gerado referencia várias tabelas adicionais de cursos e Bíblia (por exemplo, `book_chapters`, `book_introductions`, `certificates`).
- `auth.users` e `auth.identities` retornaram contagem zero na consulta anterior. Isso não corresponde ao histórico operacional relatado para o aplicativo e precisa ser confirmado no projeto/ambiente correto antes de qualquer operação.
- O schema contém os schemas gerenciados `auth` e `storage`; a contagem de tabelas públicas não inclui essas tabelas internas.

## Incidente funcional prioritário: rate limit de IA

A implementação do servidor chama a RPC `consume_ai_rate_limit` e falha de forma fechada quando ela não está disponível. A consulta direta ao banco retornou:
- `public.ai_rate_limits`: inexistente (`to_regclass` = null).
- `public.consume_ai_rate_limit(...)`: nenhuma das assinaturas consultadas foi encontrada.

Consequência provável: os endpoints de IA que dependem desse limitador podem responder com erro de serviço/limitação indisponível, mesmo que a chave do provedor esteja configurada. Não foi feito teste autenticado de ponta a ponta; validar após reconciliação.

## Segurança das funções

As funções `public.has_role(uuid, app_role)` e `public.is_admin()` existem como `SECURITY DEFINER`, com `search_path=public`. `is_admin()` delega a `has_role(auth.uid(), 'admin')`. Não foram alteradas. A função `consume_ai_rate_limit` não foi encontrada.

## Próximas ações técnicas seguras

1. Confirmar que o projeto Supabase conectado é o projeto de produção esperado e que a contagem zero de usuários é real, sem expor credenciais.
2. Fazer backup abrangente e verificável, incluindo dados de Auth, Storage (objetos e metadados), schemas, dados, funções, triggers, políticas e secrets por meio de um procedimento seguro; testar restauração em projeto isolado.
3. Comparar uma a uma as migrações do repositório com o histórico do banco e construir um plano de reconciliação idempotente, sem reaplicar cegamente migrações antigas. A branch desta auditoria removeu o arquivo `20261108000200_fix_ai_rate_limit_rpc_signature.sql`, que colidia no mesmo identificador temporal com `20261108000200_harden_ai_rate_limit_policy.sql`; a versão de hardening foi mantida como fonte única. Essa correção é apenas no Git, não foi aplicada ao banco.
4. Restaurar primeiro o schema e a função de rate limit ausentes somente após backup/restore testado e confirmação de ambiente; preservar usuários, progresso e conteúdo.
5. Rodar CI completo: `npm ci`, lint, Prettier, build, TypeScript e testes.

## Validações já existentes no repositório

O workflow `.github/workflows/validate.yml` executa lint, formatação dos arquivos críticos, build de produção, TypeScript e testes. As proteções de autenticação, limite de corpo e rate limit já estão implementadas no código; não duplicar essas camadas.

## Estado desta auditoria

- Branch: `codex/security-audit-hardening-2026-11-10`
- Mudanças no Supabase: nenhuma.
- Deploy/merge: nenhum.
- Correção no Git: removida a migração duplicada `20261108000200_fix_ai_rate_limit_rpc_signature.sql`; mantida a versão hardened com o mesmo timestamp. Nenhuma correção de runtime foi validada ainda; o bloqueio do banco precisa ser resolvido com segurança antes.
