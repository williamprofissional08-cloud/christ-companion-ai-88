ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS tts_script text;

ALTER TABLE public.lesson_media ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.lesson_media ADD COLUMN IF NOT EXISTS voice text;
ALTER TABLE public.lesson_media ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pt-BR';

ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS audio_position_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS read_percent integer NOT NULL DEFAULT 0;

UPDATE public.courses SET status = 'published', published_at = COALESCE(published_at, now()) WHERE slug = 'como-estudar-a-biblia';

UPDATE public.course_modules m SET status = 'published'
FROM public.courses c
WHERE m.course_id = c.id AND c.slug = 'como-estudar-a-biblia' AND m.order_index = 1;

INSERT INTO public.lessons (module_id, slug, title, summary, duration_minutes, tier, order_index, status, tts_script)
SELECT m.id,
  'o-que-significa-estudar-a-biblia',
  'O que significa estudar a Bíblia?',
  'Entenda a diferença entre ler e estudar a Bíblia e por que o estudo cuidadoso das Escrituras transforma a vida cristã.',
  18,
  'free',
  1,
  'published',
  'Seja bem-vindo à primeira aula do curso Como Estudar a Bíblia.

Nesta aula vamos responder a uma pergunta simples e profunda: o que significa, de fato, estudar a Bíblia?

Ler a Bíblia é passar os olhos pelo texto. Estudar a Bíblia é parar diante do texto, observar com atenção, entender o que o autor quis dizer e obedecer ao que Deus revela.

Em Segunda Carta a Timóteo, capítulo três, versículos dezesseis e dezessete, Paulo afirma que toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça, a fim de que o homem de Deus seja plenamente preparado para toda boa obra.

Observe as palavras: ensino, correção, preparo. A Bíblia não foi dada apenas para informar. Ela foi dada para formar.

Estudar a Bíblia também é aprender a viver. Em Filipenses, capítulo quatro, versículos dez a treze, Paulo diz que aprendeu a viver contente em toda e qualquer situação. Ele aprendeu. Não nasceu sabendo. O estudo das Escrituras molda o coração ao longo do tempo.

Jesus é o melhor exemplo de mestre das Escrituras. Em Lucas, capítulo vinte e quatro, versículo vinte e sete, ele explicou aos discípulos, começando por Moisés e todos os profetas, o que as Escrituras diziam a respeito dele mesmo.

Um pouco adiante, em Lucas, capítulo vinte e quatro, versículos quarenta e quatro e quarenta e cinco, está escrito que ele abriu o entendimento deles para compreenderem as Escrituras. Isso nos ensina algo essencial: precisamos de dependência de Deus para entender a Palavra.

Há também um alerta. Em João, capítulo cinco, versículos trinta e nove e quarenta, Jesus fala de pessoas que examinavam as Escrituras com muito cuidado, mas não queriam ir a ele para ter vida. É possível estudar a Bíblia e continuar longe de Deus. Por isso, o alvo do estudo é o encontro com Cristo, não apenas o acúmulo de conhecimento.

Por fim, pense no Salmo vinte e três. Muitos sabem esse salmo de memória. Estudar esse texto é perguntar quem é o pastor, o que ele faz, para onde ele conduz e o que significa nada temer. O mesmo texto conhecido se torna profundo quando é estudado.

Então, estudar a Bíblia envolve três movimentos simples.

Primeiro, observar. O que o texto diz?

Segundo, interpretar. O que o texto significa dentro do seu contexto?

Terceiro, aplicar. Como devo viver a partir disso?

Antes de encerrar, um convite prático. Escolha um horário fixo, comece com um livro, leia com calma, anote suas observações e ore pedindo entendimento.

Vamos orar. Senhor, obrigado pela tua Palavra. Abre o meu entendimento, guarda o meu coração de orgulho e ensina-me a viver aquilo que eu aprendo. Em nome de Jesus, amém.

Seu desafio para esta aula é separar quinze minutos hoje para estudar o Salmo vinte e três, anotando ao menos três observações do texto.

Na próxima aula seguiremos aprendendo a observar um texto bíblico com atenção. Que Deus te abençoe no seu estudo.'
FROM public.course_modules m
JOIN public.courses c ON c.id = m.course_id
WHERE c.slug = 'como-estudar-a-biblia' AND m.order_index = 1
  AND NOT EXISTS (SELECT 1 FROM public.lessons l WHERE l.slug = 'o-que-significa-estudar-a-biblia');

INSERT INTO public.lesson_content (lesson_id, kind, title, body, scripture_refs, order_index)
SELECT l.id, v.kind, v.title, v.body, v.refs, v.ord
FROM public.lessons l
CROSS JOIN (VALUES
  ('introducao','Introdução','Existe uma diferença enorme entre ler a Bíblia e estudar a Bíblia. Ler é passar os olhos pelo texto. Estudar é parar diante do texto, observar com atenção, entender o que o autor quis comunicar e responder com obediência.

Muitos cristãos já leram várias passagens, mas poucos aprenderam a estudá-las. Esta aula é o ponto de partida: entender o que significa estudar a Bíblia e por que isso transforma a vida.', ARRAY['2 Timóteo 3:16-17']::text[],1),
  ('objetivos','Objetivos da aula','Ao final desta aula você deverá ser capaz de:

Explicar a diferença entre ler e estudar a Bíblia.

Reconhecer que a Escritura foi dada para formar o caráter, e não apenas informar a mente.

Identificar os três movimentos básicos do estudo bíblico: observar, interpretar e aplicar.

Iniciar uma rotina simples e constante de estudo das Escrituras.', ARRAY[]::text[],2),
  ('texto','O que a Bíblia diz sobre si mesma','Paulo escreve que toda a Escritura é inspirada por Deus e útil para o ensino, a repreensão, a correção e a instrução na justiça, para que o servo de Deus esteja plenamente preparado para toda boa obra (2 Timóteo 3:16-17). Três palavras merecem atenção: ensino, correção e preparo. A Bíblia informa, corrige e capacita.

Isso significa que o estudo bíblico nunca é neutro. Quem se aproxima do texto com sinceridade sai diferente, porque a Palavra age sobre a mente, a consciência e a vontade.

O aprendizado espiritual também é progressivo. Paulo afirma que aprendeu a viver contente em toda e qualquer situação (Filipenses 4:10-13). Ele aprendeu. Houve processo, tempo e dependência de Deus. O estudo das Escrituras funciona da mesma forma: é uma caminhada, não um evento único.', ARRAY['2 Timóteo 3:16-17','Filipenses 4:10-13']::text[],3),
  ('referencias','Referências bíblicas da aula','Guarde estas passagens. Elas sustentam tudo o que foi ensinado nesta aula e servirão de base para as próximas.

2 Timóteo 3:16-17 — a origem e a utilidade das Escrituras.
Filipenses 4:10-13 — o aprendizado espiritual é progressivo.
Lucas 24:27 — Jesus explica as Escrituras.
Lucas 24:44-45 — Jesus abre o entendimento dos discípulos.
João 5:39-40 — conhecimento sem Cristo não gera vida.
Salmo 23 — um texto conhecido que se torna profundo quando estudado.', ARRAY['2 Timóteo 3:16-17','Filipenses 4:10-13','Lucas 24:27','Lucas 24:44-45','João 5:39-40','Salmo 23']::text[],4),
  ('exemplos','Jesus, o mestre das Escrituras','No caminho de Emaús, Jesus explicou aos discípulos, começando por Moisés e por todos os profetas, o que as Escrituras diziam a respeito dele (Lucas 24:27). Ele não apenas citou versículos: mostrou o sentido do texto dentro do plano de Deus.

Em seguida, está escrito que ele abriu o entendimento deles para compreenderem as Escrituras (Lucas 24:44-45). Aqui aprendemos que método sem dependência de Deus não basta. Estudamos com esforço e oramos pedindo entendimento.

Há também um alerta sério. Jesus fala de pessoas que examinavam as Escrituras diligentemente, mas não queriam vir a ele para ter vida (João 5:39-40). É possível dominar informação bíblica e permanecer distante de Deus. O alvo do estudo é Cristo.', ARRAY['Lucas 24:27','Lucas 24:44-45','João 5:39-40']::text[],5),
  ('aplicacao','Como isso se aplica à sua vida','O estudo bíblico se resume a três movimentos simples que serão aprofundados nos próximos módulos.

Observar: o que o texto realmente diz? Quem fala, com quem fala, quais palavras se repetem?

Interpretar: o que o texto significa dentro do seu contexto histórico e literário?

Aplicar: como devo viver diante daquilo que Deus revelou?

Comece pequeno e constante: escolha um horário fixo, um livro da Bíblia, um caderno e ore antes de ler. Constância vale mais que intensidade.', ARRAY[]::text[],6),
  ('reflexao','Reflexão','Tome o Salmo 23, um texto que talvez você já conheça de memória. Leia com calma e pergunte: quem é este pastor? O que ele faz? Para onde ele conduz? O que significa dizer "nada me faltará"?

Perceba como um texto familiar se torna profundo quando é estudado, e não apenas repetido.', ARRAY['Salmo 23']::text[],7),
  ('exercicio','Exercício','Escreva em seu caderno ou no diário do aplicativo:

1. Com suas palavras, qual é a diferença entre ler e estudar a Bíblia?
2. Segundo 2 Timóteo 3:16-17, para que serve a Escritura?
3. O que João 5:39-40 nos alerta sobre o conhecimento bíblico?
4. Três observações que você fez ao estudar o Salmo 23.', ARRAY['2 Timóteo 3:16-17','João 5:39-40','Salmo 23']::text[],8),
  ('oracao','Oração','Senhor, obrigado pela tua Palavra. Abre o meu entendimento, como abriste o entendimento dos discípulos. Guarda o meu coração do orgulho do conhecimento e ensina-me a viver aquilo que eu aprendo. Que o meu estudo me leve sempre a Cristo. Em nome de Jesus, amém.', ARRAY['Lucas 24:44-45']::text[],9),
  ('desafio','Desafio','Separe quinze minutos hoje para estudar o Salmo 23. Leia três vezes, anote ao menos três observações do texto e escreva uma aplicação prática para a sua semana.', ARRAY['Salmo 23']::text[],10),
  ('encerramento','Encerramento','Estudar a Bíblia é ouvir a Deus com atenção e responder com obediência. Você deu o primeiro passo.

Na próxima aula aprenderemos a observar um texto bíblico com cuidado, notando detalhes que passam despercebidos em uma leitura apressada.', ARRAY[]::text[],11)
) AS v(kind,title,body,refs,ord)
WHERE l.slug = 'o-que-significa-estudar-a-biblia'
  AND NOT EXISTS (SELECT 1 FROM public.lesson_content lc WHERE lc.lesson_id = l.id);

INSERT INTO public.lesson_questions (lesson_id, kind, prompt, options, answer_key, explanation, scripture_refs, order_index)
SELECT l.id, v.kind, v.prompt, v.options::jsonb, v.answer_key, v.explanation, v.refs, v.ord
FROM public.lessons l
CROSS JOIN (VALUES
  ('multipla','Segundo 2 Timóteo 3:16-17, para que a Escritura é útil?','["Apenas para informação histórica","Para ensino, repreensão, correção e instrução na justiça","Somente para líderes da igreja","Apenas para memorização"]','Para ensino, repreensão, correção e instrução na justiça','Paulo afirma que a Escritura é inspirada por Deus e útil para formar o servo de Deus para toda boa obra.', ARRAY['2 Timóteo 3:16-17']::text[],1),
  ('multipla','O que Jesus fez no caminho de Emaús, segundo Lucas 24:27?','["Ordenou silêncio aos discípulos","Explicou as Escrituras a respeito dele, começando por Moisés e os profetas","Escreveu um novo livro","Proibiu perguntas"]','Explicou as Escrituras a respeito dele, começando por Moisés e os profetas','Jesus mostrou o sentido do texto dentro do plano de Deus, sendo o modelo de mestre das Escrituras.', ARRAY['Lucas 24:27']::text[],2),
  ('multipla','Qual é o alerta de João 5:39-40?','["Ninguém deve estudar a Bíblia","É possível examinar as Escrituras e ainda assim não ir a Cristo","Somente o Antigo Testamento importa","O estudo bíblico é opcional"]','É possível examinar as Escrituras e ainda assim não ir a Cristo','O alvo do estudo é o encontro com Cristo, não o acúmulo de conhecimento.', ARRAY['João 5:39-40']::text[],3),
  ('aberta','Com suas palavras, qual é a diferença entre ler e estudar a Bíblia?','[]',NULL,'Ler é passar os olhos pelo texto; estudar é observar, interpretar e aplicar, dependendo de Deus para entender.', ARRAY['2 Timóteo 3:16-17']::text[],4)
) AS v(kind,prompt,options,answer_key,explanation,refs,ord)
WHERE l.slug = 'o-que-significa-estudar-a-biblia'
  AND NOT EXISTS (SELECT 1 FROM public.lesson_questions q WHERE q.lesson_id = l.id);
