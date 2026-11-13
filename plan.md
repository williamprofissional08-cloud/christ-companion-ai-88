# Plano — Conversas em Minhas Mensagens

## Produto e implementação

A rota **Minhas mensagens** terá duas áreas para não apagar o recurso existente: **Conversas** como experiência principal e **Esboços** para os esboços de pregação já salvos. Conversas permitirá procurar pessoas pelo nome, iniciar conversa direta, criar grupo com nome, filtrar mensagens não lidas, abrir um histórico, enviar mensagens e adicionar participantes a grupos. O diretório será a view autenticada `community_member_profiles`, mostrando somente nome e avatar — nunca e-mail ou metadados privados.

A persistência usará três tabelas Supabase novas: conversas, participantes e mensagens. A migração incluirá índices, limites de conteúdo e RLS para restringir cada consulta e envio aos participantes daquela conversa. Funções RPC autenticadas criarão conversas diretas de forma idempotente, criarão grupos e adicionarão pessoas somente quando quem convida já participa do grupo. Cada participante atualizará apenas o próprio estado de leitura. Conversas diretas terão chave única para evitar duplicatas. Mensagens serão texto simples, limitadas a 2.000 caracteres. Supabase Realtime atualizará a caixa de entrada e o tópico aberto sem recarregar a página; a autorização real continua sendo decidida pela RLS no banco.

Não será removida nem reutilizada a tabela `chat_messages`: ela armazena diálogos do assistente IA. A funcionalidade nova usará tabelas distintas para membros. Não serão adicionadas dependências externas; avatares vêm dos perfis existentes e mensagens do diretório seguro. A branch e a PR ficam separadas da alteração BLIVRE ainda em revisão.

## Estrutura do projeto

- `src/routes/_authenticated/minhas-mensagens.tsx`: abas Conversas/Esboços, estado de seleção e shell da página.
- `src/components/messaging/`: caixa de entrada, janela da conversa, criação de conversa/grupo e inclusão de participantes.
- `src/lib/member-messaging.ts`: tipos, consultas, mutações e utilitários de formatação usados pelo frontend.
- `supabase/migrations/<timestamp>_member_messaging.sql`: tabelas, índices, RPCs, grants, RLS e publicação Realtime.
- `tests/member-messaging.test.mjs`: regressões das regras locais de apresentação/estado e verificações do contrato da migração.
- `TODO.md`: resultados solicitados e critérios preservados durante a implementação.

## Design

**Design Movement:** editorial devocional contemporâneo do Caminho Divino, seguindo a referência visual fornecida para Minhas mensagens.

**Core Principles:** conversas privadas por padrão; leitura rápida com nomes, avatares e prévias; ações claras para iniciar e organizar conversas; nenhuma perda dos esboços existentes.

**Color Philosophy:** manter a base clara e serena do app, azul profundo para identidade e ações principais, azul-claro para seleção/não lidas e tons neutros para separar mensagens sem ruído visual.

**Layout Paradigm:** foco mobile-first. No celular, alternar entre caixa de entrada e conversa aberta; em telas largas, usar painel dividido com lista à esquerda e conversa à direita. A busca e os filtros ficam acima da lista, e a ação de nova conversa permanece visível.

**Signature Elements:** avatares circulares com fallback de iniciais; ponto azul de não lida; balões próprios/alheios com contraste suave e ícones lineares do conjunto já usado pelo app.

**Interaction Philosophy:** foco no teclado e acessibilidade; busca progressiva por nome; envio com estado de carregamento e erros explícitos; retorno imediato da lista e da contagem de não lidas após uma mensagem ou leitura.

**Animation:** transições discretas de 150–200 ms em abertura de painel, seleção e envio; sem animação contínua que distraia da leitura.

**Typography System:** reutilizar a fonte serifada `font-display` nos títulos e a tipografia sans-serif existente para nomes, prévias, mensagens e controles; preservar as escalas responsivas atuais.

**Brand Essence:** um espaço seguro e acolhedor para membros conversarem, orarem e caminharem juntos; personalidade próxima, respeitosa e confiável.

**Brand Voice:** textos breves, calorosos e objetivos. Exemplos: “Comece uma conversa” e “Que bom caminhar com você.”

**Wordmark & Logo:** manter o wordmark atual Caminho Divino; usar o ícone `MessageCircle` já disponível para identificar conversas, sem criar ou substituir o logotipo.

**Signature Brand Color:** manter o azul primário existente do Caminho Divino como cor exclusiva dos botões de ação e estados ativos.
