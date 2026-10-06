# Atualização dos estudos, leitura e áudio

## Objetivo
Transformar estudos e aulas em uma experiência de leitura bíblica estruturada, confiável e confortável no celular, com áudio sincronizado e retomada, preservando cursos, URLs, progresso e recursos já existentes.

## O que será construído

### 1. Base segura e compatível
- Manter o catálogo, as aulas publicadas, os estudos existentes, favoritos, respostas privadas e conclusão explícita.
- Estender os formatos existentes para suportar dois níveis: **Estudo Bíblico** e **Estudo Bíblico Aprofundado**.
- Tratar conteúdo antigo como compatível, sem exigir conversão destrutiva nem duplicar registros.

### 2. Leitor moderno de estudos
- Criar uma experiência compartilhada para estudos e aulas, com cabeçalho, referência, progresso de leitura e seções claramente hierarquizadas.
- Adicionar navegação entre seções, índice compacto, seções expansíveis quando extensas e ação **Continuar de onde parei**.
- Renderizar texto bíblico, análise, contexto, referências, aplicação, conclusão e fontes com tratamentos visuais adequados, sem colocar cartões dentro de cartões.
- Otimizar controles, tipografia e espaçamento para toque e telas pequenas.

### 3. TTS móvel e leitura sincronizada
- Substituir a fila frágil atual por um controlador único de fala em blocos curtos, iniciado somente após toque do usuário.
- Carregar e selecionar vozes pt-BR de forma assíncrona, com voz portuguesa ou narração remota como fallback.
- Implementar reproduzir, pausar, continuar, parar, trecho anterior/próximo e velocidades 0,75x, 1x, 1,25x, 1,5x, 1,75x e 2x.
- Permitir ouvir a seção atual ou o estudo completo.
- Destacar o trecho ativo, rolar suavemente até ele e manter a fila estável em estudos longos.
- Tratar cancelamentos, mudança de página, troca de aba, bloqueio de tela, retorno do segundo plano e erros do navegador sem marcar conteúdo como concluído.

### 4. Retomada e progresso
- Salvar por usuário a última seção, o trecho de áudio, a velocidade escolhida e o progresso aproximado de leitura.
- Restaurar esses dados ao retornar e oferecer retomada direta.
- Manter a conclusão somente pelo botão explícito já existente.

### 5. Geração bíblica responsável
- Reforçar a análise anterior à redação: texto, contexto imediato, capítulo, livro, gênero, história, cultura, geografia, paralelos e referências realmente relacionadas.
- Separar **texto bíblico**, **inferência**, **contexto histórico**, **interpretação** e **especulação**.
- Incluir confiança quando pertinente: alta, provável, debatida ou não afirmável com segurança.
- Validar referências e estrutura da resposta; impedir fontes, citações, páginas e termos originais inventados.
- Evitar falácia da raiz, alegorias artificiais, harmonizações inventadas e aplicações transformadas em promessas.
- Criar o painel opcional **Como chegamos a essa conclusão?** nos estudos aprofundados.
- Usar Marcos 4:35–41 apenas como referência de profundidade e organização, submetendo qualquer afirmação à mesma revisão crítica.

### 6. Aprendizagem e fixação
- Organizar estudos didáticos no fluxo: introdução, texto, contexto, explicação, aprendizados, reflexão, aplicação, fixação, resumo e desafio.
- Reutilizar perguntas, exercícios e respostas privadas já existentes; adicionar novos campos somente quando necessários.

### 7. Verificação
- Testar leitura e áudio em dimensões equivalentes a Android pequeno, celular maior, tablet e desktop.
- Verificar estudos longos, troca de seção, pausar/continuar, mudança de velocidade, retorno à página e navegação entre aulas.
- Confirmar ausência de erros de tela, console, rede e compilação, além de regressões em favoritos, quizzes, Professor IA e progresso.

## Detalhes técnicos
- O leitor e o controlador de áudio serão componentes compartilhados e incrementais.
- Alterações de dados serão aditivas, com políticas privadas por usuário e permissões explícitas.
- Conteúdo estruturado terá versão e nível, mantendo fallback para o formato atual.
- A sincronização usará unidades de fala associadas às seções renderizadas, não uma tentativa imprecisa de sincronizar um arquivo de áudio sem marcações temporais.
- A narração remota continuará como fallback; nenhum segredo será exposto no navegador.

## Fora desta atualização
- Não gerar novos capítulos de Gênesis ou avançar para Gênesis 3.
- Não substituir conteúdo bíblico já publicado sem revisão específica.
- Não alterar cobrança, hierarquia do curso ou regras de acesso.
