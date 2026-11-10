# Auditoria funcional — Caminho Divino
Data: 10/11/2026
Escopo: funcionalidades do aplicativo, excluindo a produção e auditoria editorial dos estudos bíblicos.

## Resumo executivo

A auditoria está em andamento. O workflow de validação do GitHub executou com sucesso no commit de restauração do rate limit (run 876) e no merge do PR #182 (run 875). Isso comprova lint, Prettier dos arquivos configurados, build, TypeScript e testes automatizados daquele commit; não comprova fluxos reais com usuário/browser nem publicação.

O PR #182 foi mesclado em main (merge commit e525fbff5711b9cd4af5d13800cee07ce2fb24b4). A migração `20261108000100_ai_rate_limits.sql` e a versão hardened `20261108000200_harden_ai_rate_limit_policy.sql` constam na árvore main. No Supabase, a tabela `public.ai_rate_limits` e RPC `consume_ai_rate_limit(text)` agora existem.

## Achados confirmados

### P0 — Persistência do progresso / resumo semanal
- `src/lib/app.functions.ts:getWeeklySummary` consulta `public.track_progress`.
- `src/lib/study-progress.functions.ts:getStudyCheckpoint/saveStudyCheckpoint` consultam `public.study_progress`.
- Consulta direta ao Supabase confirmou que ambas as relações não existem (`to_regclass` retorna null).
- Efeito: o resumo semanal não consegue carregar o progresso de trilhas e devolve a seção como vazia; o checkpoint de leitura/áudio dos estudos falha ao consultar/salvar.
- A criação das tabelas requer reconciliação de schema e migração revisada. Não aplicar DDL automaticamente nesta etapa.

### P1 — Divergência do schema em relação ao código
- O banco expõe atualmente 18 tabelas públicas (incluindo `ai_rate_limits`), enquanto `src/integrations/supabase/types.ts` referencia tabelas adicionais de cursos, certificados, módulos, capítulos e introduções.
- Consultas diretas confirmaram que `book_chapters`, `course_modules`, `certificates`, `study_progress` e `track_progress` não existem no banco atual.
- Não confundir ausência de conteúdo/estudos bíblicos em produção com defeito; este achado refere-se às estruturas de aplicação e persistência utilizadas pelo código.

### P1 — Segurança e privacidade do banco
- A política `Public profile directory` permite SELECT de todos os registros de `profiles` para qualquer usuário autenticado. A tabela atualmente contém apenas id, display_name, created_at, avatar_url e last_seen_at; ainda assim, confirmar que a exposição de `last_seen_at` é necessária e preferir uma view/campos públicos mínimos.
- A política `read community reactions` permite leitura geral das reações para autenticados; revisar se a exposição é intencional.
- O linter reportou funções SECURITY DEFINER executáveis por autenticados: `consume_ai_rate_limit` e `is_admin()`. A RPC de rate limit deve permanecer executável pelos usuários autenticados para o servidor autenticado e falhar fechada; `is_admin()` é usada pelas políticas e deve ter grants mínimos, não remover sem redesenhar dependências.
- Existem duas políticas permissivas para SELECT em `profiles` e duas em `user_roles`; consolidar cuidadosamente.
- A função `grant_bootstrap_admin()` atribui admin a um endereço de e-mail específico no momento do cadastro. O gatilho está ativo. Confirmar que esse mecanismo é deliberado e que não há endereço alternativo/legado antes de alterar.

### P1 — IA e áudio
- Os três endpoints possuem autenticação, rate limit e limites de payload; TTS mantém chave do provedor no servidor, timeout de 30 segundos, validação MP3 e limite de 8 MiB.
- Não foi realizado teste autenticado real do provedor nem reprodução de áudio no navegador. Estado: proteção de código identificada; integração operacional ainda não comprovada.

### P2 — Cadastro e autenticação
- O código oferece e-mail/senha, criação de conta, confirmação por e-mail, OAuth Google, recuperação e redefinição de senha.
- Os gatilhos `on_auth_user_created` (perfil) e `on_auth_user_bootstrap_admin` existem.
- O banco retornou zero linhas em `auth.users` na consulta anterior. Não foi criado usuário de teste; cadastro e callback precisam de teste ponta a ponta no ambiente real.

### P2 — Comunidade e Storage
- Tabelas, políticas e buckets existem: `community-images`, `community-library`, `profile-avatars`.
- Políticas permitem upload com pasta do usuário, leitura pública de imagens e acesso condicionado aos PDFs aprovados/pertencentes ao usuário/admin.
- Não há objetos de Storage no banco na consulta anterior. Upload, remoção, leitura e moderação ainda precisam de teste real.

### P2 — Dados pessoais
- Tabelas e funções para favoritos, metas, diário, hábitos, planos e configurações existem no schema atual, com filtros por `auth.uid()` nas funções server-side e RLS de propriedade.
- A persistência ainda precisa de teste real multiusuário e verificação de isolamento entre contas.

## Validações de CI

- GitHub Actions run 876: commit `13c6a2c77261b224b7c96bd4e7f79d9f4766f0c8`, conclusão SUCCESS.
- GitHub Actions run 875: merge commit `e525fbff5711b9cd4af5d13800cee07ce2fb24b4`, conclusão SUCCESS.
- Workflow executa npm ci, ESLint, Prettier nos arquivos críticos, build, `tsc --noEmit` e testes automatizados.
- CI verde não equivale a teste E2E, nem garante que todas as relações do banco existem.

## Plano de execução priorizado

1. **P0 — Reconciliar schema não-bíblico utilizado pelo runtime:** mapear todas as tabelas/RPC/views referenciadas no código; criar plano de migrações aditivas e idempotentes para `track_progress` e `study_progress` e demais estruturas ativas ausentes; revisar chaves únicas, FKs, índices, RLS e grants. Aplicar somente após backup verificável e validação em ambiente isolado.
2. **P1 — Corrigir integridade dos resumos e checkpoints:** adicionar testes unitários/integração para `getWeeklySummary`, `getStudyCheckpoint` e `saveStudyCheckpoint`; garantir que erro de consulta não seja silenciosamente apresentado como progresso vazio.
3. **P1 — Revisão de privacidade e funções privilegiadas:** limitar dados públicos de perfil, revisar reações e consolidar políticas redundantes; revisar EXECUTE de `is_admin()`, `has_role()`, funções de bootstrap e SECURITY DEFINER sem quebrar policies/triggers.
4. **P1 — Teste E2E de autenticação:** cadastro com confirmação, callback OAuth, login, logout, sessão após refresh, reset de senha, criação de profile e papel; usar conta de teste isolada e limpar apenas dados de teste próprios.
5. **P1 — Teste E2E de IA/TTS:** verificar provider, limites, respostas 401/429/503, persistência do chat, streaming, TTS e reprodução em Safari/iOS e navegadores desktop.
6. **P2 — Comunidade/Storage:** testar upload e validação de tipo/tamanho, ownership de pastas, URLs públicas/privadas, PDFs aprovados, moderação de primeiro post, denúncia e reação.
7. **P2 — Persistência de usuário:** teste multi-conta para favoritos, metas, diário, hábitos, planos e configurações; testar concorrência e timezone.
8. **P2 — Experiência e qualidade:** navegação em viewport mobile/desktop, acessibilidade, loading/empty/error states, captura de erros e performance.
9. **Release readiness:** CI verde em PR final, smoke tests autenticados, revisão de segurança, migrações reconciliadas, ambiente de produção confirmado e checklist de rollback.

## Limites e segurança

- Nenhuma alteração destrutiva ou DDL adicional foi executada durante esta auditoria.
- Não criar usuários reais nem usar contas de terceiros para testes.
- Não alterar/remover policies, roles, dados, buckets ou funções SECURITY DEFINER sem revisão de dependências.
- Não fazer merge nem deploy em nome do usuário.
- A auditoria permanece parcial até executar testes funcionais autenticados e reconciliar as relações ausentes.
