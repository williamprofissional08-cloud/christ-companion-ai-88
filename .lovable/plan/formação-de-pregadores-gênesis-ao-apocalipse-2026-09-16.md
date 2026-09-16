# Formação de Pregadores — Gênesis ao Apocalipse

## Objetivo

Evoluir o curso existente, sem duplicá-lo, para uma formação bíblica completa e progressiva. O conteúdo será publicado por fases, somente após validação de referências, contexto e navegação.

## Situação atual confirmada

- O curso existente já possui 66 livros, 75 estudos e 750 blocos de conteúdo.
- Gênesis possui 10 estudos; os demais livros possuem um estudo representativo.
- A estrutura atual ainda não representa capítulos, perícopes, introduções completas, glossário, contexto cultural, fontes ou exercícios avaliados.
- Progresso, meditações privadas, favoritos, mensagens próprias e certificado já existem e serão reaproveitados.
- O conteúdo atual permanecerá acessível durante a expansão; nada será apagado ou recriado.

## Estrutura definitiva

```text
Curso
├── Formação do pregador (32 módulos especiais)
└── Jornada bíblica
    ├── Testamento
    │   └── Categoria
    │       └── Livro
    │           ├── Introdução geral
    │           └── Capítulo
    │               └── Passagem / perícope
    │                   ├── Estudo e interpretação
    │                   ├── Referências e fontes
    │                   ├── Glossário e contexto cultural
    │                   ├── Quiz e exercício
    │                   └── Meditação e mensagem do aluno
```

## Fase 1 — Arquitetura escalável

- Manter `courses`, `course_modules`, `lessons`, `lesson_content`, progresso e dados pessoais existentes.
- Identificar módulos como `livro` ou `formação`, preservando os 66 módulos atuais.
- Adicionar capítulos e vincular cada aula/passagem a um capítulo e intervalo de versículos.
- Criar introduções estruturadas por livro: nome, autoria, datas e posições, contexto, cultura, geografia, personagens, tema, estrutura, conexões canônicas e Cristo no livro.
- Criar registros próprios para referências cruzadas, termos do glossário, contexto cultural e fontes editoriais.
- Reutilizar perguntas e respostas para quizzes; adicionar exercícios com entregas privadas e progresso próprio.
- Manter todos os dados pessoais isolados por usuário e todas as operações administrativas protegidas.
- Criar índices para navegação e pesquisa em grande volume.

## Fase 2 — Jornada dos 66 livros

- Migrar os 66 livros atuais para a nova hierarquia sem alterar URLs já publicadas.
- Cadastrar os 1.189 capítulos canônicos e calcular as contagens a partir dos registros reais.
- Criar páginas de livro e capítulo com navegação Testamento → Categoria → Livro → Capítulo → Passagem.
- Mostrar estados “não iniciado”, “em andamento” e “concluído” por livro e capítulo.
- Ampliar a pesquisa para livro, capítulo, referência, tema, palavra, personagem, glossário, cultura, estudo e mensagem pessoal.
- Atualizar o painel do curso com livros, capítulos, passagens, aulas, mensagens, exercícios e progresso geral.

## Fase 3 — Gênesis completo

- Criar a introdução geral de Gênesis com distinção clara entre consenso, tradição e debates acadêmicos.
- Dividir os 50 capítulos em perícopes coerentes, cobrindo todo o texto sem transformar versículos isolados em aulas artificiais.
- Produzir cada estudo no fluxo: ler → observar → meditar → contextualizar → interpretar → conectar → aplicar → estruturar → pregar.
- Incluir palavras originais somente quando relevantes e sempre subordinadas ao contexto.
- Incluir referências cruzadas explicadas, conexão legítima com Cristo, princípios, aplicações responsáveis, esboço, exercício e oração.
- Adicionar quizzes em pontos pedagógicos e persistir respostas do aluno.
- Revisar referências, limites de capítulos, nomes, datas e afirmações históricas antes de publicar cada lote.

## Fases seguintes

- Fase 4: Êxodo completo.
- Fase 5: Levítico completo.
- Fase 6: demais livros do Antigo Testamento.
- Fase 7: Novo Testamento completo.
- Fase 8: 32 módulos específicos de formação de pregadores.
- Fase 9: revisão e ampliação de exercícios, quizzes, glossário, dicionário cultural e fontes.
- Fase 10: revisão teológica, editorial, técnica, responsiva e de segurança.

Cada livro será produzido em lotes revisáveis. Um livro só será apresentado como “completo” quando todos os seus capítulos estiverem cobertos por passagens publicadas e verificadas.

## Experiência do aluno

- Transformar a página atual do curso em “Minha Jornada Bíblica”, preservando busca e continuidade.
- Criar índice rápido por Testamento e categoria, página própria para cada livro e lista expansível de capítulos.
- Manter a aula atual como ambiente principal de estudo, acrescentando contexto, termos, referências, fontes e exercícios sem remover áudio, Professor IA ou caderno do pregador.
- Evoluir “Minhas Mensagens” para abrir e editar esboços, e “Favoritos” para retornar diretamente ao estudo, passagem ou esboço salvo.
- Emitir certificado apenas quando todas as aulas publicadas obrigatórias estiverem concluídas.

## Administração e qualidade editorial

- Adicionar gestão de introduções, capítulos, passagens, glossário, cultura, fontes, referências e exercícios ao painel existente.
- Trabalhar com rascunho, revisão e publicação; conteúdo incompleto não aparecerá ao aluno.
- Registrar autoria editorial e fontes sem copiar obras ou traduções protegidas.
- Validar referências bíblicas e impedir intervalos fora dos limites canônicos.
- Exibir divergências acadêmicas e teológicas como posições, nunca como certeza bíblica.

## Validação

- Testar navegação e conteúdo em Gênesis 1 e 50, depois nos livros indicados em cada fase.
- Testar pesquisa, progresso, favoritos, meditações, exercícios, mensagens e certificado com contas separadas.
- Verificar isolamento dos dados pessoais e permissões administrativas.
- Validar celular, tablet e computador, além de teclado, leitores de tela e estados de carregamento/erro.
- Conferir contagens reais no banco antes de declarar qualquer fase concluída.
