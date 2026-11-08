# Checklist de prontidão — Caminho Divino

Este documento é o portão operacional para o piloto controlado. Ele não significa que os itens externos já foram executados.

## Validação automatizada

- [ ] `npm ci` conclui com o `package-lock.json` versionado.
- [ ] ESLint conclui sem erros nas regras semânticas.
- [ ] Os arquivos alterados passam na verificação Prettier.
- [ ] `npm run build` conclui em produção.
- [ ] Nenhuma variável secreta é exposta ao navegador ou commitada.

A workflow `.github/workflows/validate.yml` regenera o lockfile na branch de preparação sem executar scripts de dependências e depois instala de forma reproduzível.

## Supabase — exigir validação no projeto correto

Não aplicar migrations automaticamente a partir deste checklist. Antes do piloto, um responsável com acesso ao projeto Supabase deve:

- [ ] Confirmar que o projeto e o ambiente são os corretos (staging antes de produção).
- [ ] Comparar migrations versionadas com o histórico real de migrations aplicadas.
- [ ] Verificar RLS habilitado em todas as tabelas com dados de usuários.
- [ ] Confirmar que usuário A não lê nem altera conversas, mensagens, progresso, favoritos, anotações ou envios de usuário B.
- [ ] Confirmar que usuário comum não executa operações administrativas.
- [ ] Confirmar que apenas administradores podem editar/publicar conteúdo gerenciado.
- [ ] Fazer backup e plano de reversão antes de qualquer migration.
- [ ] Executar migrations somente após revisão e aprovação explícitas.

A PR #4 contém duas migrations novas. Elas são aditivas e a enum `public.content_status` já existe na linha principal, mas a PR está divergente/conflitante. Não aplicar suas migrations até que o código e a sequência sejam rebaseados, testados e aprovados.

## API de chat

- [ ] Sem token: responder 401.
- [ ] JSON inválido: responder 400.
- [ ] Corpo acima de 256 KiB, inclusive sem `Content-Length`: responder 413.
- [ ] Mais de 40 mensagens ou formato inválido: responder 400.
- [ ] Texto acima de 24.000 caracteres: responder 413.
- [ ] Thread de outro usuário: não permitir leitura nem gravação.
- [ ] Usuário válido e thread própria: transmitir resposta e persistir a conversa.
- [ ] Adicionar rate limiting persistente por usuário antes da abertura pública; não considerar o 429 do provedor de IA como substituto de proteção contra abuso.

## Fluxos funcionais para o piloto

- [ ] Cadastro, login, logout, recuperação de senha e sessão expirada.
- [ ] Catálogo e abertura de cursos/aulas.
- [ ] Salvar e retomar progresso, favoritos e anotações.
- [ ] Chat/Professor IA com créditos disponíveis e com erros 401/403/429/402.
- [ ] TTS em Android e iOS: play, pause, retomar, velocidade, avançar/voltar e retorno após fechar/reabrir a tela.
- [ ] Permissões e telas administrativas com usuário comum e administrador.
- [ ] Testar em celular e desktop, com rede lenta e reconexão.

## Privacidade e operação

- [ ] Revisar e publicar Termos de Uso e Política de Privacidade adequados ao funcionamento real.
- [ ] Definir processo de exclusão de conta e dados pessoais.
- [ ] Confirmar monitoramento de erros, consumo de IA, limites e contato de suporte.
- [ ] Fazer piloto com cerca de 10 pessoas, coletar falhas e corrigir antes de abrir ao público.

## Regra de liberação

Não promover a PR, mesclar, aplicar migrations ou publicar enquanto os testes de CI, Supabase/RLS, autenticação, privacidade e fluxos críticos não tiverem evidências registradas e aprovação do responsável.
