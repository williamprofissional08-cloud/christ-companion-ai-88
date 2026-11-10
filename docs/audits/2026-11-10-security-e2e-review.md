# Revisão de segurança e preparação de testes ponta a ponta — 10/11/2026

## Escopo
Revisão do cadastro/autenticação, políticas RLS e funções privilegiadas, Storage/comunidade, rotas de IA/TTS e reprodução de áudio. Estudos bíblicos não fazem parte desta auditoria.

## Evidências verificadas no Supabase

- Projeto consultado: `uluumebztnrgpyzohqrv`.
- O banco reporta zero usuários Auth no momento da consulta; portanto não há conta de teste existente para validar login, upload, IA ou áudio de ponta a ponta sem criar uma conta de teste autorizada.
- Os gatilhos `on_auth_user_created` e `on_auth_user_bootstrap_admin` estão ligados a `auth.users`. `handle_new_user()` cria o perfil a partir de `display_name`, `full_name` ou parte local do e-mail.
- As tabelas de dados pessoais usam políticas RLS vinculadas a `auth.uid()`; favoritos, diário, metas, configurações, progresso de hábitos e conversas têm isolamento por usuário.
- As políticas de comunidade limitam criação/alteração ao próprio usuário e a moderação a administradores.
- Storage: `community-library` é privado, PDF apenas, limite 15 MiB; `community-images` é público, 8 MiB, imagens JPEG/PNG/WebP/GIF; `profile-avatars` é público, 5 MiB, JPEG/PNG/WebP. Políticas de upload exigem pasta inicial com o UUID do usuário. PDFs aprovados são legíveis por membros autenticados.
- `has_role(uuid, app_role)` não concede EXECUTE a `anon` ou `authenticated`; apenas ao proprietário e `service_role`. `is_admin()` é executável por usuários autenticados porque a interface e políticas chamam a função; ela consulta somente `auth.uid()` da sessão atual. `consume_ai_rate_limit(text)` também é executável por autenticados intencionalmente para impor limites atômicos. As duas funções usam `SECURITY DEFINER` com `search_path` fixo e argumentos/escopos limitados.
- O advisor de segurança não reportou achados críticos. Reportou avisos para as duas funções `SECURITY DEFINER` acima e um INFO para `ai_rate_limits` sem políticas RLS. A tabela de rate limit não concede acesso direto a usuários; a escrita ocorre pela RPC controlada.

## Correção de código nesta branch

A validação anterior de PDF aceitava arquivo com extensão não-PDF quando o navegador declarava MIME `application/pdf`, e aceitava extensão PDF com MIME divergente. Foi adicionada validação de extensão, MIME declarado (quando disponível), tamanho e assinatura binária `%PDF-` antes do upload.

Arquivos:
- `src/lib/community-pdf-validation.ts`
- `src/routes/_authenticated/comunidade.tsx`
- `tests/community-pdf-validation.test.mjs`

A validação no cliente reduz envios acidentais/disfarçados, mas não substitui validação de conteúdo no servidor: Storage valida bucket, autenticação, caminho, tamanho e MIME informado, não faz análise antivírus nem prova criptográfica do formato.

## Testes ponta a ponta: estado real

**Ainda não executados com uma conta real.** A consulta ao banco encontrou zero usuários Auth e não foi disponibilizada uma conta de teste, caixa de e-mail de teste ou credencial descartável. Não criei usuários de teste, não enviei e-mails, não fiz uploads de arquivos, não consumi créditos de IA nem gerei áudio em produção.

O CI atual cobre lint, formatação, build, TypeScript e testes Node, mas não cobre navegador real nem autenticação/Storage/IA/TTS no projeto remoto. A validação de TTS no servidor já limita corpo e resposta, exige autenticação, rate limit, MIME de áudio e tamanho máximo; isso é inspeção de código, não prova de reprodução no dispositivo.

## Bloqueios para concluir E2E real

1. Conta de teste descartável no Supabase com e-mail verificável (ou configuração de teste que permita confirmar cadastro).
2. Permissão/ambiente para executar cadastro e exclusão apenas dessa conta de teste.
3. URL de produção/preview que esteja efetivamente publicada e a autorização para fazer chamadas de teste de baixo volume.
4. Dispositivo/navegador real para validar SpeechSynthesis, pausa, retomada, interrupção e troca de voz. A voz nativa do sistema não pode ser validada por uma chamada HTTP.

Não é necessário compartilhar senhas ou chaves no chat. O teste pode ser executado por workflow protegido com GitHub Actions Secrets ou por ambiente de homologação.

## Próximos passos prioritários

1. Executar CI da branch e corrigir qualquer regressão.
2. Configurar ambiente de homologação e conta de teste descartável.
3. Rodar cadastro/confirmar e-mail/login/logout/recuperação; upload e download de PDF privado; negar acesso cruzado entre dois usuários; chamadas autenticadas e não autenticadas de chat/Professor IA/TTS; rate limit; validar MP3 retornado.
4. Fazer teste manual de TTS nativo em iOS e Android (play/pause/resume/seek/velocidade/saída de app).
5. Não alterar RLS, grants ou schema de produção sem backup restaurável e teste de restauração.

## Restrições respeitadas
Nenhuma alteração foi aplicada ao banco Supabase; nenhum usuário/dado foi criado ou apagado; nenhum segredo foi lido ou exibido; não houve merge nem deploy.
