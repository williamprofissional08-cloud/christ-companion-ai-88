
INSERT INTO public.courses (slug, title, subtitle, description, level, tier, status, order_index)
SELECT 'introducao-a-biblia',
       'Introdução à Bíblia',
       'Fundamentos para entender a Palavra de Deus',
       $t$Curso introdutório para quem está começando. Você vai entender o que é a Bíblia, como ela foi formada, como está organizada, a diferença entre Antigo e Novo Testamento, os grupos de livros, o contexto dos autores, a centralidade de Jesus Cristo nas Escrituras, como ler com bom senso e como aplicar a Palavra à vida diária.$t$,
       'iniciante','free','published',2
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'introducao-a-biblia');

INSERT INTO public.course_modules (course_id, title, summary, order_index, status)
SELECT c.id, m.title, m.summary, m.ord, 'published'::public.content_status
FROM public.courses c
CROSS JOIN (VALUES
 (1,'O que é a Bíblia','Compreender a natureza, a origem e a autoridade das Escrituras.'),
 (2,'Como a Bíblia foi formada','Inspiração, formação do cânon e transmissão fiel dos textos.'),
 (3,'Antigo e Novo Testamento','A unidade da história da salvação em dois Testamentos.'),
 (4,'Os principais grupos de livros','A organização dos 66 livros e o que esperar de cada grupo.'),
 (5,'Autores, contexto e propósito','Quem escreveu, para quem, quando e com qual finalidade.'),
 (6,'A Bíblia e Jesus Cristo','Cristo como centro e chave de leitura das Escrituras.'),
 (7,'Como ler e compreender a Bíblia','Primeiros passos de leitura, contexto e interpretação responsável.'),
 (8,'Aplicando a Palavra à vida','Da leitura à obediência prática no dia a dia.')
) AS m(ord,title,summary)
WHERE c.slug = 'introducao-a-biblia'
  AND NOT EXISTS (SELECT 1 FROM public.course_modules cm WHERE cm.course_id = c.id AND cm.order_index = m.ord);

INSERT INTO public.lessons (module_id, slug, title, summary, duration_minutes, tier, status, order_index)
SELECT cm.id, l.slug, l.title, l.summary, l.mins, 'free'::public.access_tier, 'published'::public.content_status, 1
FROM public.courses c
JOIN public.course_modules cm ON cm.course_id = c.id
JOIN (VALUES
 (1,'ib-a-biblia-palavra-de-deus','A Bíblia: a Palavra de Deus escrita','O que é a Bíblia, por que ela é chamada Palavra de Deus e qual é a sua autoridade na vida cristã.',12),
 (2,'ib-inspiracao-canon-transmissao','Inspiração, cânon e transmissão','Como Deus inspirou os autores, como os livros foram reconhecidos e como o texto chegou até nós.',14),
 (3,'ib-dois-testamentos-uma-historia','Dois Testamentos, uma só história','A diferença e a continuidade entre Antigo e Novo Testamento.',13),
 (4,'ib-grupos-de-livros','Como os 66 livros estão organizados','Os grupos de livros do Antigo e do Novo Testamento e o que esperar de cada um.',15),
 (5,'ib-autores-contexto-proposito','Quem escreveu, para quem e por quê','Autores, época, cultura e propósito: por que o contexto muda a leitura.',13),
 (6,'ib-cristo-centro-das-escrituras','Cristo, o centro das Escrituras','Como toda a Bíblia aponta para Jesus e para o evangelho.',14),
 (7,'ib-primeiros-passos-de-leitura','Primeiros passos de leitura e interpretação','Um método simples e seguro para começar a ler a Bíblia sozinho.',15),
 (8,'ib-da-leitura-a-obediencia','Da leitura à obediência','Como transformar o que você lê em vida prática, com oração e comunidade.',13)
) AS l(ord,slug,title,summary,mins) ON l.ord = cm.order_index
WHERE c.slug = 'introducao-a-biblia'
  AND NOT EXISTS (SELECT 1 FROM public.lessons ls WHERE ls.slug = l.slug);

INSERT INTO public.lesson_content (lesson_id, kind, title, body, scripture_refs, order_index)
SELECT ls.id, b.kind, b.title, b.body, b.refs, b.ord
FROM public.lessons ls
JOIN (VALUES
-- AULA 1
('ib-a-biblia-palavra-de-deus','introducao','Por onde começar', $t$Muita gente abre a Bíblia pela primeira vez e se sente perdida: são muitos livros, nomes difíceis e séculos de distância. Esta aula existe para tirar esse peso. Antes de aprender a estudar, é preciso entender o que temos em mãos: um livro que Deus quis que fosse escrito para que pudéssemos conhecê-lo.$t$, ARRAY[]::text[],1),
('ib-a-biblia-palavra-de-deus','objetivos','O que você vai aprender', $t$1. Entender o que é a Bíblia e por que ela é chamada de Palavra de Deus.
2. Perceber a diferença entre a Bíblia e qualquer outro livro religioso.
3. Reconhecer a autoridade das Escrituras para a fé e para a vida.$t$, ARRAY[]::text[],2),
('ib-a-biblia-palavra-de-deus','texto','Um livro e muitos livros', $t$A Bíblia é uma coleção de 66 livros, escritos ao longo de cerca de 1.500 anos, por mais de 40 autores diferentes, em três idiomas (hebraico, aramaico e grego), em continentes e situações muito diversas: palácios, prisões, desertos e cidades. Mesmo assim, ela conta uma única história: Deus criando, o ser humano se afastando e Deus resgatando o seu povo por Jesus Cristo.

Essa unidade não é um acidente literário. Ela existe porque, por trás dos muitos autores humanos, há um só Autor divino.$t$, ARRAY[]::text[],3),
('ib-a-biblia-palavra-de-deus','texto','Por que chamamos de Palavra de Deus', $t$A Bíblia afirma que ela mesma é inspirada por Deus. Isso não significa que os autores foram máquinas de escrever: eles usaram sua linguagem, sua história e seu estilo. Significa que o Espírito Santo os conduziu de modo que o resultado final é exatamente o que Deus quis comunicar.

Por isso a Bíblia é confiável e tem autoridade: não porque a igreja decidiu, mas porque Deus falou.$t$, ARRAY['2 Timóteo 3:16','2 Pedro 1:21'],4),
('ib-a-biblia-palavra-de-deus','referencias','Textos para ler hoje', $t$2 Timóteo 3:16-17 — toda a Escritura é inspirada e útil.
2 Pedro 1:20-21 — homens falaram da parte de Deus, movidos pelo Espírito Santo.
Salmos 119:105 — lâmpada para os pés e luz para o caminho.
Hebreus 4:12 — a Palavra é viva e eficaz.$t$, ARRAY['2 Timóteo 3:16','2 Pedro 1:21','Salmos 119:105','Hebreus 4:12'],5),
('ib-a-biblia-palavra-de-deus','exemplos','Um exemplo simples', $t$Imagine receber uma carta de alguém que ama você e conhece o seu futuro. Você não leria correndo, nem escolheria só as frases confortáveis. A Bíblia é maior que uma carta, mas o princípio serve: ela é comunicação pessoal de Deus, não um manual de frases soltas para usar quando dá vontade.$t$, ARRAY[]::text[],6),
('ib-a-biblia-palavra-de-deus','aplicacao','Aplicação prática', $t$Escolha um horário fixo, mesmo que curto, para ler a Bíblia esta semana. Comece com dez minutos por dia. Antes de ler, faça uma oração breve: "Senhor, fala comigo pela tua Palavra". Depois de ler, anote uma frase que você entendeu.$t$, ARRAY['Salmos 119:105'],7),
('ib-a-biblia-palavra-de-deus','reflexao','Perguntas para reflexão', $t$1. O que você esperava encontrar na Bíblia antes desta aula?
2. Se a Bíblia é a voz de Deus escrita, o que muda na forma como você a lê?
3. Existe alguma área da sua vida em que você evita ouvir o que a Palavra diz?$t$, ARRAY[]::text[],8),
('ib-a-biblia-palavra-de-deus','encerramento','Resumo e conclusão', $t$A Bíblia é uma biblioteca com uma única história, escrita por autores humanos e inspirada por Deus. Ela tem autoridade porque vem de Deus, e foi dada para que conheçamos a Cristo e vivamos com Ele. Na próxima aula veremos como esses livros foram formados e chegaram até nós.$t$, ARRAY[]::text[],9),
-- AULA 2
('ib-inspiracao-canon-transmissao','introducao','Uma dúvida honesta', $t$"Como sei que a Bíblia que tenho hoje é confiável?" Essa pergunta é legítima e tem resposta. Nesta aula veremos três palavras que resolvem boa parte da dúvida: inspiração, cânon e transmissão.$t$, ARRAY[]::text[],1),
('ib-inspiracao-canon-transmissao','objetivos','O que você vai aprender', $t$1. O que significa dizer que a Bíblia é inspirada.
2. Como os livros foram reconhecidos como Escritura (cânon).
3. Como o texto foi copiado e preservado ao longo dos séculos.$t$, ARRAY[]::text[],2),
('ib-inspiracao-canon-transmissao','texto','Inspiração: Deus falando por pessoas', $t$Inspiração é a ação do Espírito Santo sobre os autores bíblicos. Deus não anulou a personalidade deles: Lucas pesquisou testemunhas, Paulo escreveu cartas a igrejas reais, Davi cantou em meio à dor. Ainda assim, o texto final é Palavra de Deus.$t$, ARRAY['Lucas 1:1','2 Timóteo 3:16'],3),
('ib-inspiracao-canon-transmissao','texto','Cânon: reconhecer, não inventar', $t$Cânon significa "regra", "medida". A igreja não criou a autoridade dos livros: ela reconheceu os livros que já tinham autoridade, por serem escritos por profetas e apóstolos, por concordarem com o restante da revelação e por serem recebidos pelo povo de Deus. Jesus tratava as Escrituras do Antigo Testamento como Palavra de Deus, e os apóstolos escreveram com essa mesma autoridade.$t$, ARRAY['Mateus 5:18','2 Pedro 3:16'],4),
('ib-inspiracao-canon-transmissao','texto','Transmissão: cópias e traduções', $t$Antes da imprensa, o texto era copiado à mão por escribas cuidadosos. Existem milhares de manuscritos antigos, e a comparação entre eles mostra um texto notavelmente estável. As traduções modernas nascem desses manuscritos, e é por isso que existem notas de rodapé: elas são sinal de honestidade, não de fragilidade.$t$, ARRAY['Isaías 40:8'],5),
('ib-inspiracao-canon-transmissao','referencias','Textos para ler hoje', $t$2 Pedro 1:20-21 — origem da profecia.
Mateus 5:17-18 — Jesus e a permanência da Escritura.
Isaías 40:8 — a Palavra permanece para sempre.
Lucas 1:1-4 — pesquisa cuidadosa de Lucas.$t$, ARRAY['2 Pedro 1:21','Mateus 5:18','Isaías 40:8','Lucas 1:1'],6),
('ib-inspiracao-canon-transmissao','exemplos','Um exemplo do dia a dia', $t$Quando muitas pessoas copiam a mesma carta e depois comparamos todas as cópias, os pequenos erros de cada uma ficam evidentes justamente porque as demais preservam o original. É assim que o grande número de manuscritos ajuda a confirmar o texto bíblico.$t$, ARRAY[]::text[],7),
('ib-inspiracao-canon-transmissao','aplicacao','Aplicação prática', $t$Escolha uma tradução confiável e use-a como sua leitura principal. Se puder, compare um trecho em duas traduções e observe que a mensagem permanece a mesma. Isso fortalece a confiança e evita discussões inúteis.$t$, ARRAY[]::text[],8),
('ib-inspiracao-canon-transmissao','reflexao','Perguntas para reflexão', $t$1. Qual dúvida você tinha sobre a confiabilidade da Bíblia?
2. Como a ideia de "reconhecer" o cânon difere de "inventar" o cânon?
3. O que muda em sua leitura sabendo que Deus preservou a sua Palavra?$t$, ARRAY[]::text[],9),
('ib-inspiracao-canon-transmissao','encerramento','Resumo e conclusão', $t$Deus inspirou, a igreja reconheceu e a providência preservou. Você pode ler a Bíblia com confiança. A seguir, veremos como os dois Testamentos se relacionam.$t$, ARRAY[]::text[],10),
-- AULA 3
('ib-dois-testamentos-uma-historia','introducao','Duas partes, um só plano', $t$Muitos leitores param no Antigo Testamento por acharem que ele "não é para hoje". Outros leem só o Novo e perdem o alicerce. Esta aula mostra como os dois se encaixam.$t$, ARRAY[]::text[],1),
('ib-dois-testamentos-uma-historia','objetivos','O que você vai aprender', $t$1. O que significa a palavra "testamento" (aliança).
2. Como o Antigo Testamento prepara o Novo.
3. Por que o cristão continua lendo o Antigo Testamento.$t$, ARRAY[]::text[],2),
('ib-dois-testamentos-uma-historia','texto','Testamento é aliança', $t$"Testamento" traduz a ideia de aliança: um compromisso que Deus estabelece com o seu povo. No Antigo Testamento, Deus se compromete com Israel e prepara a vinda do Salvador. No Novo, essa promessa se cumpre em Jesus, que institui a nova aliança em seu sangue.$t$, ARRAY['Jeremias 31:31','Lucas 22:20'],3),
('ib-dois-testamentos-uma-historia','texto','Promessa e cumprimento', $t$O Antigo Testamento vai da criação ao silêncio profético, passando pela lei, pela história de Israel e pelos profetas. O Novo apresenta Jesus, a igreja e a consumação. A relação entre eles é de promessa e cumprimento: sombra e realidade, expectativa e chegada.$t$, ARRAY['Hebreus 8:6','Lucas 24:44'],4),
('ib-dois-testamentos-uma-historia','referencias','Textos para ler hoje', $t$Jeremias 31:31-34 — a promessa da nova aliança.
Lucas 24:44-47 — Jesus explica as Escrituras.
Hebreus 8:6-13 — uma aliança superior.
Romanos 15:4 — o que foi escrito antes serve para nosso ensino.$t$, ARRAY['Jeremias 31:31','Lucas 24:44','Hebreus 8:6','Romanos 15:4'],5),
('ib-dois-testamentos-uma-historia','exemplos','Um exemplo', $t$O cordeiro da Páscoa, no Êxodo, protegia o povo pelo sangue na porta. Séculos depois, João Batista aponta para Jesus e diz: "Eis o Cordeiro de Deus". O primeiro evento não perde valor; ele ganha sentido pleno no segundo.$t$, ARRAY['Êxodo 12:13','João 1:29'],6),
('ib-dois-testamentos-uma-historia','aplicacao','Aplicação prática', $t$Leia esta semana um capítulo do Evangelho de Lucas e um Salmo. Ao terminar, pergunte: o que este texto me ensina sobre o Deus que salva? Anote em uma linha.$t$, ARRAY[]::text[],7),
('ib-dois-testamentos-uma-historia','reflexao','Perguntas para reflexão', $t$1. Você costuma evitar alguma parte da Bíblia? Por quê?
2. Como entender "aliança" muda sua leitura do Antigo Testamento?
3. Onde você já viu promessa e cumprimento na sua própria história com Deus?$t$, ARRAY[]::text[],8),
('ib-dois-testamentos-uma-historia','encerramento','Resumo e conclusão', $t$Antigo e Novo Testamento não competem: eles se completam em Cristo. Na próxima aula vamos organizar os 66 livros em grupos para você nunca mais se perder no sumário.$t$, ARRAY[]::text[],9),
-- AULA 4
('ib-grupos-de-livros','introducao','Um mapa do sumário', $t$Saber onde você está muda tudo. Quando você entende os grupos de livros, deixa de abrir a Bíblia ao acaso e passa a ler com direção.$t$, ARRAY[]::text[],1),
('ib-grupos-de-livros','objetivos','O que você vai aprender', $t$1. Os grupos de livros do Antigo Testamento.
2. Os grupos de livros do Novo Testamento.
3. O que esperar do estilo de cada grupo.$t$, ARRAY[]::text[],2),
('ib-grupos-de-livros','texto','Antigo Testamento: 39 livros', $t$Pentateuco (Gênesis a Deuteronômio): origem do mundo, do povo e da lei.
Históricos (Josué a Ester): a caminhada de Israel, com fidelidade e fracassos.
Poéticos e de sabedoria (Jó a Cantares): oração, dor, louvor e vida prática.
Profetas maiores (Isaías a Daniel) e menores (Oseias a Malaquias): a voz de Deus chamando ao arrependimento e anunciando esperança.$t$, ARRAY[]::text[],3),
('ib-grupos-de-livros','texto','Novo Testamento: 27 livros', $t$Evangelhos (Mateus, Marcos, Lucas e João): a vida, a morte e a ressurreição de Jesus.
Atos: o nascimento e a expansão da igreja.
Cartas de Paulo (Romanos a Filemom) e cartas gerais (Hebreus a Judas): ensino e correção para igrejas e pessoas reais.
Apocalipse: a esperança final e a vitória de Cristo.$t$, ARRAY[]::text[],4),
('ib-grupos-de-livros','referencias','Textos para ler hoje', $t$Lucas 24:44 — Lei, Profetas e Salmos.
Atos 1:8 — o mapa do livro de Atos.
Salmos 1:1-3 — o tom dos livros poéticos.$t$, ARRAY['Lucas 24:44','Atos 1:8','Salmos 1:1'],5),
('ib-grupos-de-livros','exemplos','Um exemplo prático', $t$Se você está triste, um Salmo conversa com você de um jeito diferente de uma carta de Paulo. Não é que um valha mais: é que cada grupo tem uma linguagem. Ler poesia como se fosse manual gera confusão; ler carta como se fosse poesia gera imprecisão.$t$, ARRAY[]::text[],6),
('ib-grupos-de-livros','aplicacao','Aplicação prática', $t$Abra o sumário da sua Bíblia e marque com lápis os grupos. Depois, escolha um livro curto de cada grupo para ler nos próximos meses: por exemplo, Rute, Tiago e Marcos.$t$, ARRAY[]::text[],7),
('ib-grupos-de-livros','reflexao','Perguntas para reflexão', $t$1. Qual grupo de livros você menos conhece?
2. Como o estilo do texto pode mudar a forma de ler?
3. Qual livro curto você vai ler primeiro?$t$, ARRAY[]::text[],8),
('ib-grupos-de-livros','encerramento','Resumo e conclusão', $t$Com o mapa na mão, a leitura fica mais leve. A seguir, vamos olhar para os autores e o contexto em que escreveram.$t$, ARRAY[]::text[],9),
-- AULA 5
('ib-autores-contexto-proposito','introducao','Texto sem contexto', $t$Existe um ditado útil entre estudantes da Bíblia: texto sem contexto vira pretexto. Nesta aula vamos aprender a perguntar quem escreveu, para quem e por quê.$t$, ARRAY[]::text[],1),
('ib-autores-contexto-proposito','objetivos','O que você vai aprender', $t$1. Reconhecer o autor humano e o público original de um livro.
2. Perceber a diferença entre o mundo bíblico e o nosso.
3. Identificar o propósito de um texto antes de aplicá-lo.$t$, ARRAY[]::text[],2),
('ib-autores-contexto-proposito','texto','Pessoas reais, situações reais', $t$Paulo escreveu a Filipenses de uma prisão, a uma igreja generosa. Lucas escreveu a Teófilo para dar segurança sobre o que havia sido ensinado. Jeremias falou a um povo prestes a ser levado cativo. Saber isso não diminui a Palavra: torna a leitura mais precisa e mais humana.$t$, ARRAY['Filipenses 1:12','Lucas 1:3'],3),
('ib-autores-contexto-proposito','texto','Três perguntas de contexto', $t$1. Contexto imediato: o que vem antes e depois do versículo?
2. Contexto do livro: qual é o assunto e o objetivo desse livro?
3. Contexto histórico: quem era esse povo e o que estava acontecendo?

Essas três perguntas evitam a maioria dos erros de interpretação.$t$, ARRAY[]::text[],4),
('ib-autores-contexto-proposito','referencias','Textos para ler hoje', $t$Jeremias 29:11 lido junto com Jeremias 29:4-14 — a promessa dentro do exílio.
Filipenses 4:13 lido junto com Filipenses 4:10-14 — contentamento em toda situação.
Lucas 1:1-4 — o propósito declarado do autor.$t$, ARRAY['Jeremias 29:11','Filipenses 4:13','Lucas 1:1'],5),
('ib-autores-contexto-proposito','exemplos','Um exemplo conhecido', $t$Filipenses 4:13 costuma ser citado como promessa de sucesso. No contexto, Paulo fala de aprender a viver com fartura e com escassez, sustentado por Cristo. A promessa é maior e mais real do que a versão popular.$t$, ARRAY['Filipenses 4:13'],6),
('ib-autores-contexto-proposito','aplicacao','Aplicação prática', $t$Pegue um versículo que você gosta e leia o capítulo inteiro em volta dele. Escreva em uma frase qual era a intenção do autor ao escrever aquilo.$t$, ARRAY[]::text[],7),
('ib-autores-contexto-proposito','reflexao','Perguntas para reflexão', $t$1. Você já usou um versículo fora do contexto? O que aprendeu?
2. Qual das três perguntas de contexto é mais difícil para você?
3. Como o contexto pode aprofundar, e não enfraquecer, uma promessa?$t$, ARRAY[]::text[],8),
('ib-autores-contexto-proposito','encerramento','Resumo e conclusão', $t$Ler bem é ouvir o que o autor quis dizer, no lugar de projetar o que queremos ouvir. Agora estamos prontos para ver o centro de toda a Escritura: Cristo.$t$, ARRAY[]::text[],9),
-- AULA 6
('ib-cristo-centro-das-escrituras','introducao','A chave de leitura', $t$Se a Bíblia é uma história, ela tem um protagonista. Jesus disse que as Escrituras falavam dele. Esta aula mostra por que ler a Bíblia sem Cristo é perder o fio da meada.$t$, ARRAY['João 5:39'],1),
('ib-cristo-centro-das-escrituras','objetivos','O que você vai aprender', $t$1. Compreender por que Cristo é o centro das Escrituras.
2. Reconhecer promessas messiânicas no Antigo Testamento.
3. Ler qualquer texto perguntando como ele se liga ao evangelho.$t$, ARRAY[]::text[],2),
('ib-cristo-centro-das-escrituras','texto','Jesus explica a própria Bíblia', $t$No caminho de Emaús, Jesus começa por Moisés e pelos profetas e explica o que dizia respeito a ele em todas as Escrituras. Esse é o modelo de leitura cristã: não forçar Jesus em cada frase, mas reconhecer que toda a história caminha para ele.$t$, ARRAY['Lucas 24:27','João 5:39'],3),
('ib-cristo-centro-das-escrituras','texto','Promessas que se cumprem', $t$Isaías 53 descreve o servo que sofre pelos pecados do povo. Miqueias 5:2 aponta Belém. Salmos 22 antecipa a cruz. Esses textos não são coincidência: são a preparação de Deus para o momento em que a promessa se torna pessoa.$t$, ARRAY['Isaías 53:5','Miqueias 5:2','Salmos 22:1'],4),
('ib-cristo-centro-das-escrituras','referencias','Textos para ler hoje', $t$Lucas 24:25-27 — Cristo em todas as Escrituras.
João 5:39-40 — as Escrituras testificam de Jesus.
Isaías 53:4-6 — o servo sofredor.
Colossenses 1:15-20 — a supremacia de Cristo.$t$, ARRAY['Lucas 24:27','João 5:39','Isaías 53:5','Colossenses 1:15'],5),
('ib-cristo-centro-das-escrituras','destaque','Princípio da aula', $t$A Bíblia não é principalmente um livro sobre o que você deve fazer por Deus, mas sobre o que Deus fez por você em Jesus Cristo. A obediência nasce daí.$t$, ARRAY[]::text[],6),
('ib-cristo-centro-das-escrituras','aplicacao','Aplicação prática', $t$Leia Isaías 53 devagar e, em seguida, leia a crucificação em Lucas 23. Escreva o que você sente ao ver a promessa e o cumprimento lado a lado.$t$, ARRAY['Isaías 53:5'],7),
('ib-cristo-centro-das-escrituras','reflexao','Perguntas para reflexão', $t$1. Você lê a Bíblia mais como regras ou como história de salvação?
2. O que significa dizer que Cristo é o centro?
3. Como isso muda sua oração hoje?$t$, ARRAY[]::text[],8),
('ib-cristo-centro-das-escrituras','encerramento','Resumo e conclusão', $t$Cristo é a chave. Com ele no centro, cada parte da Bíblia encontra o seu lugar. A próxima aula ensina um método simples de leitura.$t$, ARRAY[]::text[],9),
-- AULA 7
('ib-primeiros-passos-de-leitura','introducao','Você consegue ler a Bíblia', $t$Não é preciso ser teólogo para ler bem. É preciso método simples, humildade e constância. Vamos ver um caminho de quatro passos.$t$, ARRAY[]::text[],1),
('ib-primeiros-passos-de-leitura','objetivos','O que você vai aprender', $t$1. Um método de leitura em quatro passos.
2. Erros comuns que atrapalham iniciantes.
3. Como criar um plano de leitura realista.$t$, ARRAY[]::text[],2),
('ib-primeiros-passos-de-leitura','texto','Quatro passos: orar, observar, entender, aplicar', $t$Orar: peça ao Espírito Santo entendimento antes de ler.
Observar: o que o texto diz? Quem fala, com quem, o que acontece?
Entender: o que o autor quis comunicar ao leitor original?
Aplicar: o que isso exige, promete ou muda em mim hoje?

Faça os quatro na ordem. Aplicar antes de entender é o atalho que produz erro.$t$, ARRAY['Salmos 119:18'],3),
('ib-primeiros-passos-de-leitura','texto','Erros comuns de iniciante', $t$Abrir a Bíblia ao acaso em busca de resposta imediata; ler apenas versículos isolados; comparar seu progresso com o de outros; desistir por perder alguns dias. Nada disso é fatal. Retome de onde parou e siga.$t$, ARRAY[]::text[],4),
('ib-primeiros-passos-de-leitura','referencias','Textos para ler hoje', $t$Salmos 119:18 — abre os meus olhos.
Atos 17:11 — examinavam as Escrituras todos os dias.
Neemias 8:8 — leram e explicaram o sentido.
Tiago 1:22 — ouvintes e praticantes.$t$, ARRAY['Salmos 119:18','Atos 17:11','Neemias 8:8','Tiago 1:22'],5),
('ib-primeiros-passos-de-leitura','exemplos','Exemplo aplicado', $t$Em Marcos 4:35-41, observe: Jesus dorme na tempestade, os discípulos temem, ele acalma o mar. Entenda: Marcos mostra quem é Jesus. Aplique: onde você está tentando controlar uma tempestade sozinho?$t$, ARRAY['Marcos 4:39'],6),
('ib-primeiros-passos-de-leitura','exercicio','Exercício da aula', $t$Escolha o Evangelho de Marcos. Leia um trecho curto por dia usando os quatro passos e registre uma frase de aplicação. Faça isso por sete dias seguidos.$t$, ARRAY[]::text[],7),
('ib-primeiros-passos-de-leitura','reflexao','Perguntas para reflexão', $t$1. Qual dos quatro passos você costuma pular?
2. Que horário é realista para a sua rotina?
3. O que você faria diferente ao perder um dia de leitura?$t$, ARRAY[]::text[],8),
('ib-primeiros-passos-de-leitura','encerramento','Resumo e conclusão', $t$Orar, observar, entender e aplicar: simples e suficiente para começar. Na última aula, vamos falar de obediência e vida prática.$t$, ARRAY[]::text[],9),
-- AULA 8
('ib-da-leitura-a-obediencia','introducao','Conhecimento que vira vida', $t$Estudar a Bíblia sem obedecer produz orgulho. Obedecer sem entender produz confusão. Deus quer as duas coisas juntas: entendimento que se torna vida.$t$, ARRAY[]::text[],1),
('ib-da-leitura-a-obediencia','objetivos','O que você vai aprender', $t$1. Como transformar leitura em prática concreta.
2. O papel da oração e da comunidade.
3. Como sustentar o hábito a longo prazo.$t$, ARRAY[]::text[],2),
('ib-da-leitura-a-obediencia','texto','Praticantes da Palavra', $t$Tiago compara quem ouve e não pratica a alguém que se olha no espelho e esquece o próprio rosto. A aplicação precisa ser específica: não "ser mais amoroso", mas "pedir perdão àquela pessoa nesta semana".$t$, ARRAY['Tiago 1:22','Mateus 7:24'],3),
('ib-da-leitura-a-obediencia','texto','Oração e comunidade', $t$A leitura vira conversa quando se transforma em oração: agradeça pelo que aprendeu, confesse o que a Palavra revelou, peça força para obedecer. E ninguém cresce sozinho: a igreja local corrige, ensina e sustenta.$t$, ARRAY['Atos 2:42','Hebreus 10:24'],4),
('ib-da-leitura-a-obediencia','referencias','Textos para ler hoje', $t$Tiago 1:22-25 — praticantes da Palavra.
Mateus 7:24-27 — a casa sobre a rocha.
Atos 2:42 — perseveravam no ensino dos apóstolos.
Josué 1:8 — meditar de dia e de noite.$t$, ARRAY['Tiago 1:22','Mateus 7:24','Atos 2:42','Josué 1:8'],5),
('ib-da-leitura-a-obediencia','exemplos','Exemplo de aplicação específica', $t$Texto lido: "Sede bondosos uns para com os outros". Aplicação vaga: "quero ser bondoso". Aplicação específica: "hoje vou escrever uma mensagem de encorajamento para meu colega e evitar responder com ironia".$t$, ARRAY['Efésios 4:32'],6),
('ib-da-leitura-a-obediencia','aplicacao','Aplicação prática', $t$Monte seu plano das próximas quatro semanas: horário, livro que vai ler, onde vai anotar e com quem vai conversar sobre o que aprendeu.$t$, ARRAY[]::text[],7),
('ib-da-leitura-a-obediencia','oracao','Oração final', $t$Senhor, obrigado por falar comigo. Dá-me fome da tua Palavra, humildade para entender e coragem para obedecer. Que eu conheça Jesus mais profundamente a cada leitura. Amém.$t$, ARRAY[]::text[],8),
('ib-da-leitura-a-obediencia','encerramento','Conclusão do curso', $t$Você agora sabe o que é a Bíblia, como ela foi formada, como está organizada, como o contexto ajuda, por que Cristo é o centro, como ler e como aplicar. O próximo passo é simples: continue lendo, todos os dias, com o coração aberto.$t$, ARRAY[]::text[],9)
) AS b(lesson_slug,kind,title,body,refs,ord) ON b.lesson_slug = ls.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.lesson_content lc WHERE lc.lesson_id = ls.id AND lc.order_index = b.ord
);

INSERT INTO public.lesson_questions (lesson_id, kind, prompt, options, answer_key, explanation, scripture_refs, order_index)
SELECT ls.id, q.kind, q.prompt, coalesce(q.options, '[]')::jsonb, q.answer_key, q.explanation, ARRAY[]::text[], q.ord
FROM public.lessons ls
JOIN (VALUES
('ib-a-biblia-palavra-de-deus','multipla_escolha','Por que a Bíblia é chamada de Palavra de Deus?','["Porque foi escrita por um único autor humano","Porque a igreja decidiu por votação","Porque foi inspirada por Deus, que conduziu os autores pelo Espírito Santo","Porque é o livro mais antigo do mundo"]','Porque foi inspirada por Deus, que conduziu os autores pelo Espírito Santo','2 Timóteo 3:16 e 2 Pedro 1:21 ensinam que a Escritura vem de Deus por meio de pessoas movidas pelo Espírito.',1),
('ib-a-biblia-palavra-de-deus','verdadeiro_falso','A Bíblia foi escrita por mais de 40 autores, mas conta uma única história.','["Verdadeiro","Falso"]','Verdadeiro','A diversidade de autores não quebra a unidade: a história culmina em Jesus Cristo.',2),
('ib-inspiracao-canon-transmissao','multipla_escolha','O que significa dizer que a igreja reconheceu o cânon?','["Que a igreja criou a autoridade dos livros","Que a igreja identificou os livros que já tinham autoridade divina","Que qualquer livro pode ser aceito","Que o cânon muda a cada geração"]','Que a igreja identificou os livros que já tinham autoridade divina','Reconhecer é diferente de inventar: a autoridade vem de Deus, não do reconhecimento humano.',1),
('ib-inspiracao-canon-transmissao','resposta_curta','Com suas palavras, explique a diferença entre inspiração e transmissão.',null,null,'Inspiração é a origem divina do texto; transmissão é a preservação por meio de cópias e traduções.',2),
('ib-dois-testamentos-uma-historia','multipla_escolha','A palavra "testamento" comunica principalmente a ideia de:','["Livro antigo","Aliança","Lista de regras","Profecia"]','Aliança','Testamento traduz a ideia de aliança entre Deus e o seu povo.',1),
('ib-dois-testamentos-uma-historia','verdadeiro_falso','O Antigo Testamento perdeu a utilidade para o cristão de hoje.','["Verdadeiro","Falso"]','Falso','Romanos 15:4 afirma que o que foi escrito antes serve para nosso ensino e esperança.',2),
('ib-grupos-de-livros','multipla_escolha','Qual grupo apresenta a vida, morte e ressurreição de Jesus?','["Pentateuco","Evangelhos","Profetas menores","Cartas gerais"]','Evangelhos','Mateus, Marcos, Lucas e João narram o ministério de Jesus.',1),
('ib-grupos-de-livros','resposta_curta','Cite um livro de cada grupo: histórico, poético e carta paulina.',null,null,'Exemplos possíveis: Rute (histórico), Salmos (poético) e Filipenses (carta paulina).',2),
('ib-autores-contexto-proposito','multipla_escolha','Qual pergunta faz parte da leitura contextual?','["Qual versículo combina com meu sentimento?","O que vem antes e depois do texto?","Qual é o versículo mais curto?","Quantas páginas tem o livro?"]','O que vem antes e depois do texto?','O contexto imediato é o primeiro filtro para evitar erros de interpretação.',1),
('ib-autores-contexto-proposito','verdadeiro_falso','Filipenses 4:13 fala de contentamento em toda situação, não de sucesso garantido.','["Verdadeiro","Falso"]','Verdadeiro','O contexto de Filipenses 4:10-14 trata de viver com fartura e com escassez sustentado por Cristo.',2),
('ib-cristo-centro-das-escrituras','multipla_escolha','Segundo Lucas 24:27, o que Jesus fez no caminho de Emaús?','["Ensinou apenas o Novo Testamento","Explicou o que dizia respeito a ele em todas as Escrituras","Pediu silêncio sobre as profecias","Escreveu um novo livro"]','Explicou o que dizia respeito a ele em todas as Escrituras','Jesus mostrou que Moisés e os profetas apontavam para ele.',1),
('ib-cristo-centro-das-escrituras','resposta_curta','Escreva com suas palavras por que Cristo é o centro da Bíblia.',null,null,'Toda a história da Escritura caminha para a salvação realizada por Jesus.',2),
('ib-primeiros-passos-de-leitura','multipla_escolha','Qual é a ordem correta do método apresentado?','["Aplicar, orar, observar, entender","Orar, observar, entender, aplicar","Observar, aplicar, orar, entender","Entender, aplicar, observar, orar"]','Orar, observar, entender, aplicar','Aplicar antes de entender é o atalho que produz erro de interpretação.',1),
('ib-primeiros-passos-de-leitura','verdadeiro_falso','Perder alguns dias de leitura significa que devo recomeçar tudo do zero.','["Verdadeiro","Falso"]','Falso','Basta retomar de onde parou; constância importa mais do que perfeição.',2),
('ib-da-leitura-a-obediencia','multipla_escolha','Uma boa aplicação da Palavra é:','["Genérica e vaga","Específica e possível de praticar esta semana","Apenas emocional","Adiada para o futuro"]','Específica e possível de praticar esta semana','Tiago 1:22 chama o leitor a ser praticante, e não apenas ouvinte.',1),
('ib-da-leitura-a-obediencia','resposta_curta','Escreva uma aplicação específica que você praticará nos próximos sete dias.',null,null,'A resposta é pessoal; o importante é ser concreta, datada e verificável.',2)
) AS q(lesson_slug,kind,prompt,options,answer_key,explanation,ord) ON q.lesson_slug = ls.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.lesson_questions lq WHERE lq.lesson_id = ls.id AND lq.order_index = q.ord
);
