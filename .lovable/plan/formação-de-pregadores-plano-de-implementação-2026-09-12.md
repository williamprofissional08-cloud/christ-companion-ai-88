# Formação de Pregadores — plano de implementação

## Escopo confirmado

- Adicionar um curso **gratuito** à Escola Bíblica atual, sem recriar o aplicativo.
- Publicar a jornada completa dos **66 livros**, usando cada livro como um módulo.
- Entregar **10 estudos completos de Gênesis** e **1 estudo-base representativo para cada um dos outros 65 livros**: 75 estudos iniciais no total.
- Manter cursos, autenticação, administração, progresso, áudio, Professor IA, favoritos e identidade visual existentes.

## O que será construído

### 1. Conteúdo e organização

- Criar o curso “Formação de Pregadores”, com subtítulo e descrição informados.
- Organizar os 66 módulos por Testamento e categoria: Pentateuco, Históricos, Poéticos, Profetas, Evangelhos, História, Cartas e Profecia.
- Cadastrar 75 estudos publicados, todos gratuitos, com referências e palavras-chave pesquisáveis.
- Produzir os 10 estudos de Gênesis seguindo a sequência completa: ler, meditar, observar, compreender, conectar, aplicar, preparar e orar.
- Fazer de “Gênesis 1 — A Criação” o modelo mais completo, incluindo contexto, mensagem central, referências cruzadas e esboço integral.
- Incluir uma aula inicial sobre pregação expositiva, textual, temática, biográfica e evangelística dentro da jornada de Gênesis.

### 2. Experiência do aluno

- Adaptar a página do curso para grandes jornadas, com:
  - resumo de progresso;
  - livros estudados de 66;
  - estudos concluídos;
  - mensagens preparadas;
  - dias de estudo;
  - busca por livro, passagem, tema, personagem e palavra-chave;
  - mapa da Bíblia agrupado por Testamento e categoria;
  - estados “concluído”, “em andamento” e “não iniciado”.
- Adaptar a página de estudo para exibir a sequência pedagógica com navegação visual clara.
- Adicionar botão “Ler passagem” integrado à Bíblia existente.
- Adicionar favorito do estudo usando o sistema atual.

### 3. Respostas pessoais e mensagens

- Usar o progresso existente para conclusão, leitura e retomada.
- Adicionar armazenamento privado por usuário para:
  - meditação pessoal;
  - resposta “O que esta Palavra falou comigo?”;
  - respostas dos exercícios.
- Criar a ferramenta “Minha Mensagem” com tema, texto, objetivo, introdução, três pontos, referências, explicações, aplicações, conclusão e observações.
- Criar “Minhas Mensagens” para listar, abrir, editar e excluir os esboços salvos.
- Aplicar regras de acesso para que cada usuário veja e altere somente os próprios dados.

### 4. Progresso e certificado

- Continuar usando `lesson_progress` e `course_progress`; nenhum sistema paralelo será criado.
- Calcular livros percorridos, estudos concluídos, mensagens preparadas e sequência de dias a partir dos registros reais.
- Reutilizar a tabela de certificados já existente.
- Liberar o certificado somente após 100% dos estudos publicados concluídos, com emissão idempotente e vinculada ao usuário.

### 5. Administração e manutenção

- Preservar o painel administrativo atual.
- Acrescentar ao editor de módulos os campos de Testamento e categoria.
- Acrescentar ao editor de aulas passagem-base e palavras-chave.
- Manter conteúdos em blocos modulares, permitindo ampliar cada livro com novos estudos sem alterar a navegação.

## Detalhes técnicos

- Alterar de forma aditiva `course_modules` com metadados opcionais de Testamento/categoria e `lessons` com passagem/termos de busca.
- Criar duas tabelas privadas: respostas do estudo e mensagens do aluno, com permissões explícitas, proteção por usuário, índices e atualização automática de data.
- Criar funções autenticadas para salvar respostas, gerenciar mensagens, pesquisar estudos, favoritar e emitir certificado após validação da conclusão.
- Criar componentes específicos e pequenos para jornada, formulário de meditação e editor de mensagem; reutilizar `AppShell`, `Card`, `Button`, `Progress`, abas e componentes da aula.
- Manter os dados do novo curso em um arquivo de carga idempotente e aplicá-los ao banco existente sem alterar os cursos atuais.

## Validação

- Conferir abertura do curso, dos 66 livros e dos 75 estudos.
- Testar Gênesis 1 de ponta a ponta: passagem, meditação, mensagem, favorito, exercício e conclusão.
- Confirmar persistência após recarregar e reabrir.
- Confirmar isolamento dos dados pessoais pelas regras do banco.
- Testar busca, progresso, certificado e “Minhas Mensagens”.
- Validar visualmente em celular, tablet e desktop, além das verificações automáticas do projeto.
