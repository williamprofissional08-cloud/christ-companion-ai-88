# Curso Enoque — Escola Bíblica

**Título:** Enoque: a história, o contexto e o caminho com Deus  
**Slug:** `enoque-historia-contexto-caminho-com-deus`  
**Banco conectado:** projeto Supabase `uluumebztnrgpyzohqrv`  
**Estrutura:** 2 módulos, 8 aulas, 210 minutos estimados.

## Arquivos de conteúdo
- `curso.json`: título, apresentação, boas-vindas, fontes, critérios e títulos alternativos.
- `aulas-1-4.json`: investigação dos dois Enoques, genealogia de Gênesis 5, 'andou com Deus' e limites de sua rotina.
- `aulas-5-8.json`: Hebreus, Judas, quadro de evidências, aplicações, glossário, linha do tempo, leitura de sete dias, plano pessoal de sete dias, 10 questões e gabarito.

Cada aula inclui pergunta, objetivos, roteiro temporal, contexto, leitura, análise passo a passo, termos, fatos, interpretações e limites, método de estudo, aplicação explicitamente rotulada, quatro questões, atividade, resumo de até cinco pontos, oração opcional e referências.

## Publicação
O conteúdo foi cadastrado diretamente nas tabelas **existentes** `courses`, `course_modules`, `lessons` e `lesson_content`, para ser exibido pelas rotas `/escola`, `/escola/$slug` e `/escola/$slug/aula/$lessonSlug` do aplicativo. Esta branch é a **fonte editorial versionada**, e não precisa executar migrações para mostrar as aulas já cadastradas.

**Não aplicar importação cega novamente:** o conteúdo já está no banco. Uma sincronização futura deve usar o slug, os IDs e uma rotina idempotente cuidadosamente revisada; nunca deletar e recriar o curso sem preservar possíveis registros de progresso.

## Proveniência e direitos
- **Bíblia:** Gênesis 4:17 e 5:18–24; Hebreus 11:5–6; Judas 14–15 como eixos.
- **Complemento acadêmico:** Filipe Guimarães, *A influência narratológica enoqueana no desenvolvimento epistemológico do cristianismo primitivo* (UNIFAP, 2018), fornecido pelo usuário.
- Não reproduzir longos trechos de traduções bíblicas protegidas nem do livro acadêmico.
- Diferenciar afirmações textuais, interpretações, tradições extrabíblicas e aplicações contemporâneas.
- Não apresentar os escritos de 1 Enoque como se fossem parte de Gênesis, nem uniformizar o cânon das igrejas cristãs.

## Verificação editorial
- 8 aulas, de 25 a 30 minutos cada;
- 32 perguntas de discussão (4 por aula);
- 10 perguntas de avaliação final com gabarito explicado;
- sem biografia devocional inventada de Enoque;
- roteiro de estudo com total de 210 minutos;
- sem alterações em migrações, dependências, rotas, RLS ou chaves do projeto.

**Atenção:** a checagem de estrutura no banco não substitui uma navegação end-to-end com uma conta de aluno autenticada.
