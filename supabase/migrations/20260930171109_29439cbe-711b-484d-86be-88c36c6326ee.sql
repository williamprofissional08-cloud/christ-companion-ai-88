DO $$
DECLARE
  genesis_module uuid := '718bae70-f0ca-410b-b778-c3204d76e9d6';
  genesis_chapter uuid := '48085352-6fd8-4b10-a0f1-b5664f92f4e0';
  existing_first uuid := '748b935f-2301-4bb8-8651-138cfed0f675';
BEGIN
  UPDATE public.lessons
  SET chapter_id = NULL, verse_start = NULL, verse_end = NULL
  WHERE id = '5029101c-220b-4181-ae81-5d41efb6fd0f';

  UPDATE public.lessons
  SET order_index = order_index + 7
  WHERE module_id = genesis_module AND order_index BETWEEN 2 AND 9;

  UPDATE public.lessons
  SET slug = 'genesis-1-1-2-no-principio-deus',
      title = 'Gênesis 1:1–2 — No princípio, Deus',
      summary = 'A abertura de Gênesis apresenta Deus como Criador, a criação ainda não ordenada e o Espírito de Deus sobre as águas. A aula ensina a ler o texto com atenção literária, histórica e teológica, sem transformar hipóteses em certezas.',
      duration_minutes = 55,
      passage = 'Gênesis 1:1-2',
      chapter_id = genesis_chapter,
      verse_start = 1,
      verse_end = 2,
      keywords = ARRAY['criação','Deus','princípio','Espírito de Deus','céus e terra'],
      order_index = 1,
      status = 'published',
      is_published = true
  WHERE id = existing_first;

  INSERT INTO public.lessons (id,module_id,slug,title,summary,duration_minutes,tier,order_index,is_published,status,passage,keywords,chapter_id,verse_start,verse_end)
  VALUES
    ('a1000001-0000-4000-8000-000000000003',genesis_module,'genesis-1-3-5-primeiro-dia','Gênesis 1:3–5 — Primeiro dia','Deus ordena que haja luz, separa luz e trevas e estabelece dia e noite. A passagem forma o aluno na observação da Palavra eficaz de Deus e da organização do tempo.',48,'free',2,true,'published','Gênesis 1:3-5',ARRAY['luz','Palavra de Deus','dia','noite','separação'],genesis_chapter,3,5),
    ('a1000001-0000-4000-8000-000000000006',genesis_module,'genesis-1-6-8-segundo-dia','Gênesis 1:6–8 — Segundo dia','A expansão separa as águas e recebe o nome de céus. A aula trata com cuidado a linguagem do mundo percebido pelo observador antigo e evita impor cosmologias modernas ao texto.',48,'free',3,true,'published','Gênesis 1:6-8',ARRAY['expansão','céus','águas','ordem','criação'],genesis_chapter,6,8),
    ('a1000001-0000-4000-8000-000000000009',genesis_module,'genesis-1-9-13-terceiro-dia','Gênesis 1:9–13 — Terceiro dia: terra e vegetação','Deus reúne as águas, faz aparecer a porção seca e ordena que a terra produza vegetação. A passagem une limites, fecundidade e provisão dentro da ordem criada.',50,'free',4,true,'published','Gênesis 1:9-13',ARRAY['terra','mares','vegetação','semente','fruto'],genesis_chapter,9,13),
    ('a1000001-0000-4000-8000-000000000014',genesis_module,'genesis-1-14-19-quarto-dia','Gênesis 1:14–19 — Quarto dia: luminares','Os luminares servem para sinais, tempos, dias e anos e governam dia e noite sob a autoridade do Criador. A aula distingue o texto bíblico de especulações e de leituras astrológicas.',52,'free',5,true,'published','Gênesis 1:14-19',ARRAY['luminares','tempos','estações','sol','lua','estrelas'],genesis_chapter,14,19),
    ('a1000001-0000-4000-8000-000000000020',genesis_module,'genesis-1-20-23-quinto-dia','Gênesis 1:20–23 — Quinto dia: criaturas marinhas e aves','Deus enche águas e céus de seres vivos, cria as grandes criaturas marinhas e pronuncia a primeira bênção explícita de fecundidade.',48,'free',6,true,'published','Gênesis 1:20-23',ARRAY['seres vivos','mares','aves','bênção','fecundidade'],genesis_chapter,20,23),
    ('a1000001-0000-4000-8000-000000000024',genesis_module,'genesis-1-24-25-animais-terrestres','Gênesis 1:24–25 — Animais terrestres','A terra produz animais segundo suas espécies, e Deus avalia sua obra como boa. A aula observa classificação, diversidade e dependência do Criador.',44,'free',7,true,'published','Gênesis 1:24-25',ARRAY['animais','espécies','terra','bondade','Criador'],genesis_chapter,24,25),
    ('a1000001-0000-4000-8000-000000000026',genesis_module,'genesis-1-26-31-imagem-de-deus','Gênesis 1:26–31 — O ser humano à imagem de Deus','Homem e mulher são criados à imagem e semelhança de Deus, recebem uma vocação responsável e vivem da provisão divina. A aula aprofunda dignidade, domínio, comunidade e missão.',70,'free',8,true,'published','Gênesis 1:26-31',ARRAY['imagem de Deus','humanidade','homem e mulher','domínio','muito bom'],genesis_chapter,26,31)
  ON CONFLICT (module_id,slug) DO UPDATE SET
    title=EXCLUDED.title, summary=EXCLUDED.summary, duration_minutes=EXCLUDED.duration_minutes,
    tier=EXCLUDED.tier, order_index=EXCLUDED.order_index, is_published=true, status='published',
    passage=EXCLUDED.passage, keywords=EXCLUDED.keywords, chapter_id=EXCLUDED.chapter_id,
    verse_start=EXCLUDED.verse_start, verse_end=EXCLUDED.verse_end;

  DELETE FROM public.lesson_content
  WHERE lesson_id IN (existing_first,'a1000001-0000-4000-8000-000000000003','a1000001-0000-4000-8000-000000000006','a1000001-0000-4000-8000-000000000009','a1000001-0000-4000-8000-000000000014','a1000001-0000-4000-8000-000000000020','a1000001-0000-4000-8000-000000000024','a1000001-0000-4000-8000-000000000026');
  DELETE FROM public.lesson_questions
  WHERE lesson_id IN (existing_first,'a1000001-0000-4000-8000-000000000003','a1000001-0000-4000-8000-000000000006','a1000001-0000-4000-8000-000000000009','a1000001-0000-4000-8000-000000000014','a1000001-0000-4000-8000-000000000020','a1000001-0000-4000-8000-000000000024','a1000001-0000-4000-8000-000000000026');
  DELETE FROM public.lesson_cross_references
  WHERE lesson_id IN (existing_first,'a1000001-0000-4000-8000-000000000003','a1000001-0000-4000-8000-000000000006','a1000001-0000-4000-8000-000000000009','a1000001-0000-4000-8000-000000000014','a1000001-0000-4000-8000-000000000020','a1000001-0000-4000-8000-000000000024','a1000001-0000-4000-8000-000000000026');
  DELETE FROM public.content_sources
  WHERE lesson_id IN (existing_first,'a1000001-0000-4000-8000-000000000003','a1000001-0000-4000-8000-000000000006','a1000001-0000-4000-8000-000000000009','a1000001-0000-4000-8000-000000000014','a1000001-0000-4000-8000-000000000020','a1000001-0000-4000-8000-000000000024','a1000001-0000-4000-8000-000000000026');
  DELETE FROM public.lesson_exercises
  WHERE lesson_id IN (existing_first,'a1000001-0000-4000-8000-000000000003','a1000001-0000-4000-8000-000000000006','a1000001-0000-4000-8000-000000000009','a1000001-0000-4000-8000-000000000014','a1000001-0000-4000-8000-000000000020','a1000001-0000-4000-8000-000000000024','a1000001-0000-4000-8000-000000000026');
END $$;

CREATE TEMP TABLE genesis1_seed (
  lesson_id uuid, reference text, passage_title text, objective text, overview text,
  observation text, immediate_context text, book_context text, historical text, cultural text,
  literary text, terms text, explanation text, theology text, interpretations text, not_saying text,
  cross_refs text, christ text, principles text, application text, meditation text,
  sermon text, outline text, errors text, challenge text, prayer text, final_reflection text,
  refs text[]
) ON COMMIT DROP;

INSERT INTO genesis1_seed VALUES
('748b935f-2301-4bb8-8651-138cfed0f675','Gênesis 1:1-2','No princípio, Deus',
'Aprender a reconhecer a afirmação central da abertura bíblica — Deus é o Criador de tudo — e distinguir o que o texto declara das perguntas que ele não pretende responder diretamente.',
'Gênesis começa com Deus, não com uma defesa de sua existência. O primeiro versículo resume o ato criador que abrange toda a realidade; o segundo descreve a terra ainda sem forma organizada para habitação, coberta por trevas e águas, enquanto o Espírito de Deus paira. O movimento do capítulo será do não ordenado ao ordenado, do não preenchido ao preenchido.',
'Observe os sujeitos e verbos: Deus cria; a terra estava; trevas cobriam; o Espírito de Deus pairava. “Céus e terra” funciona como expressão abrangente da totalidade. Há contrastes em preparação: trevas/luz, águas/espaços, vazio/preenchimento. Ainda não há ordem dirigida ao ser humano nem conflito entre deuses.',
'Antes desta passagem não há narrativa bíblica. Depois dela, Gênesis 1:3-31 desenvolve a ordenação e o preenchimento da criação, e Gênesis 2:1-3 apresenta o descanso do sétimo dia. Os versículos 1-2 são a porta de entrada literária para toda a sequência.',
'Gênesis apresenta origens: mundo, humanidade, pecado, juízo, nações e a família da promessa. Gênesis 1:1-2 estabelece que o Deus que chama Abraão em Gênesis 12 é o Senhor de toda a criação, não uma divindade local.',
'FATO: o texto pertence ao mundo do antigo Oriente Próximo e usa linguagem compreensível a leitores antigos. INTERPRETAÇÃO ACADÊMICA: estudiosos comparam sua forma e vocabulário com textos mesopotâmicos e egípcios para perceber semelhanças e diferenças. HIPÓTESE: dependência literária direta de um texto específico não pode ser afirmada somente por paralelos gerais. A data exata de composição e o processo editorial de Gênesis são debatidos; a tradição judaica e cristã associa o Pentateuco a Moisés, enquanto propostas acadêmicas discutem formação e edição ao longo do tempo.',
'Em culturas vizinhas, relatos de origem frequentemente envolviam genealogias ou conflitos de divindades. Gênesis apresenta um único Deus soberano, anterior à criação, que não nasce do cosmos nem precisa combater um rival equivalente. A comparação ilumina o contraste, mas não autoriza reconstruções históricas que o texto não fornece.',
'A passagem é prosa narrativa altamente organizada e elevada. Gênesis 1 emprega fórmulas repetidas — “Deus disse”, “assim aconteceu”, avaliação e numeração do dia. Gênesis 1:1 pode ser lido como declaração inicial que resume a criação ou como primeira ação da narrativa; ambas as leituras reconhecem Deus como Criador.',
'“No princípio” traduz bereshit, expressão que abre a narrativa do começo da ordem criada. “Criou” traduz bara, verbo que no Antigo Testamento tem Deus como sujeito em seus usos característicos; aqui destaca a ação divina, mas o verbo isolado não resolve todas as perguntas sobre processo e matéria. Tohu wavohu descreve a terra “sem forma e vazia”, isto é, ainda não organizada e não preenchida para a vida humana. Ruach Elohim pode significar Espírito de Deus; alguns propõem “vento poderoso”. O contexto e a tradição de tradução favorecem Espírito de Deus, mas a discussão deve ser declarada.',
'O versículo 1 afirma que Deus criou a totalidade. O versículo 2 focaliza a condição inicial da terra. “Sem forma e vazia” não é chamada de mal e não descreve necessariamente um juízo anterior; é o cenário que será ordenado. As trevas não são uma divindade rival. O Espírito pairando comunica presença e atividade divina sobre as águas. TEXTO: Deus cria e está presente. INTERPRETAÇÃO: há debate sobre a relação sintática entre os versículos. APLICAÇÃO: a realidade pertence a Deus e deve ser recebida com reverência.',
'A passagem fundamenta a distinção Criador-criação, a soberania de Deus e a bondade do propósito que o capítulo revelará. A doutrina cristã da criação a partir do nada se apoia no testemunho canônico amplo, como Hebreus 11:3, não apenas na definição lexical de bara. O Espírito aparece associado à obra criadora sem que estes dois versículos exponham toda a doutrina trinitária.',
'Existem diferentes interpretações cristãs sobre a sintaxe do versículo 1, a extensão temporal dos eventos e a relação com modelos científicos. Leitura tradicional entende 1:1 como criação inicial absoluta; outras leituras entendem como título ou oração temporal. Cristãos também defendem dias comuns, estrutura literária, dias analógicos ou períodos extensos. A aula não transforma uma dessas propostas em medida de fidelidade ao evangelho; pergunta primeiro o que o texto afirma teologicamente.',
'O texto não informa a idade do universo, não descreve mecanismos científicos detalhados e não ensina que a matéria seja divina. Também não afirma uma queda de Satanás entre os versículos 1 e 2. A chamada “teoria da lacuna” é uma interpretação possível defendida por alguns, mas não é exigida pela gramática e não deve ser pregada como fato.',
'Salmos 33:6-9 mostra criação pela palavra e pelo sopro de Deus. Isaías 45:18 afirma que Deus formou a terra para ser habitada, iluminando o movimento de ordenação. João 1:1-3 retoma “no princípio” e declara que tudo veio a existir por meio do Verbo. Hebreus 11:3 ensina que o universo foi formado pela palavra de Deus.',
'João 1:1-3 é uma conexão canônica explícita: o Novo Testamento identifica o Verbo eterno, que se fez carne, como agente da criação. Colossenses 1:15-17 também afirma que todas as coisas foram criadas por meio de Cristo e para ele. Isso é testemunho apostólico, não uma alegoria inventada sobre detalhes das águas ou trevas.',
'Deus precede e sustenta toda a realidade. A criação não é autônoma nem divina. A Palavra inteira começa orientando o leitor para Deus. A presença divina transforma o não ordenado segundo seu propósito. Humildade é necessária onde o texto não responde às nossas perguntas modernas.',
'Vida pessoal: reconhecer Deus como centro, não o próprio eu. Família: ensinar que cada pessoa e o mundo pertencem ao Criador. Igreja: adorar o Deus criador e rejeitar o desprezo pela criação. Liderança: distinguir convicções textuais de hipóteses. Serviço e evangelização: apresentar Cristo como Senhor da criação sem usar ciência como atalho para o evangelho. Vida espiritual: levar desordens a Deus em oração, sem converter o versículo em promessa de solução imediata.',
'O que esta abertura revela sobre Deus antes de dizer algo sobre mim? Quais afirmações vêm do texto e quais perguntas eu trouxe de fora? Como a distinção entre Criador e criação corrige meus ídolos? Onde preciso confessar certeza excessiva sobre assunto que o texto deixa aberto?',
'TEXTO: Gênesis 1:1-2. TEMA: O Criador no princípio de tudo. IDEIA CENTRAL: toda a realidade deve sua existência e propósito ao Deus soberano, presente e ativo. OBJETIVO: levar a igreja a reconhecer Deus como origem, Senhor e centro. INTRODUÇÃO: a Bíblia começa deslocando o ser humano do centro. PONTOS: Deus cria a totalidade; a criação ainda não ordenada permanece sob sua presença; o início prepara a obra ordenadora da Palavra. APLICAÇÕES: adoração, humildade e responsabilidade. CONCLUSÃO: o Deus do princípio é conhecido canonicamente no Verbo por quem tudo foi criado.',
'Tema: “Antes de tudo, Deus”. Introdução: nossas histórias costumam começar conosco; a Escritura começa com Deus. 1) Deus é a origem de tudo (v.1): nada criado é rival ou fundamento último. 2) Deus está presente sobre o que ainda não está ordenado (v.2): o cenário não foge ao seu governo. 3) Deus prepara a criação para sua Palavra (v.2 em direção ao v.3). Conclusão: adore o Criador, receba seus limites e ouça sua Palavra. Não prometer que toda desordem pessoal será resolvida no mesmo ritmo da semana da criação.',
'Evite ler ciência moderna diretamente no vocabulário antigo; construir uma doutrina apenas com a etimologia de bara; chamar a condição do versículo 2 de pecado; afirmar uma lacuna temporal como certeza; transformar o Espírito sobre as águas em fórmula para prosperidade; forçar cada elemento a simbolizar Cristo.',
'Escreva duas colunas: “o texto afirma” e “questões em debate”. Depois formule a ideia central em uma frase de até vinte palavras e prepare um esboço sem consultar o exemplo.',
'Deus Criador, livra-me de colocar a mim mesmo no centro. Dá-me reverência diante do que revelaste, humildade diante do que não explicaste e fidelidade para anunciar que todas as coisas existem por tua vontade. Por Cristo, amém.',
'Antes de perguntar como encaixar Gênesis em todas as discussões atuais, deixe o texto fazer sua primeira obra: apresentar Deus como o princípio, o Senhor e o centro de tudo.',ARRAY['Gênesis 1:1-2','Salmos 33:6-9','Isaías 45:18','João 1:1-3','Colossenses 1:15-17','Hebreus 11:3']),
('a1000001-0000-4000-8000-000000000003','Gênesis 1:3-5','Primeiro dia',
'Observar como a Palavra de Deus produz luz, estabelece distinções e nomeia o tempo, formando uma teologia da autoridade divina sem extrapolar o texto.',
'Deus fala, a luz passa a existir, Deus a avalia como boa, separa luz e trevas, dá nomes e encerra o primeiro dia. A sequência palavra-realização-avaliação-separação-nomeação se tornará um padrão do capítulo.',
'Sublinhe “disse”, “houve”, “viu”, “separou” e “chamou”. O sujeito de todos os verbos decisivos é Deus. Note a repetição de “luz” e “trevas”, o contraste entre elas e a fórmula “tarde e manhã”. A luz é criada antes da designação dos luminares no quarto dia.',
'A passagem segue a condição de trevas em Gênesis 1:2 e inicia a ordenação. Depois, os dias dois e três organizam espaços; os dias quatro a seis os preenchem. A nomeação de dia e noite prepara a organização temporal do restante da semana.',
'Gênesis mostrará repetidamente a eficácia da fala divina: Deus chama, promete, julga e abençoa. A primeira fala registrada estabelece que sua palavra não é informação impotente, mas comando eficaz do Criador.',
'FATO: sociedades antigas marcavam o tempo pela alternância observável de luz e escuridão. INTERPRETAÇÃO: a linguagem de tarde e manhã é central no debate sobre os dias. HIPÓTESE: identificar com precisão um mecanismo físico para a luz anterior aos luminares vai além do que a passagem explica.',
'Nomear, no mundo bíblico, pode expressar autoridade e definição de função. Isso não significa que todo ato de nomear seja mágico. Dia e noite não são deuses; estão sob o comando e a avaliação do Criador.',
'A unidade possui uma cadeia compacta: ordem, cumprimento, avaliação, separação, nomeação e marca temporal. O paralelismo com o quarto dia é importante: o primeiro estabelece os domínios de luz e trevas; o quarto designa luminares para governá-los.',
'Yehi (“haja”) é forma de ordem; wayehi (“e houve”) registra cumprimento. Or (“luz”) e hoshekh (“trevas”) funcionam concretamente na narrativa. Tov (“bom”) indica adequação ao propósito de Deus, não apenas beleza subjetiva. Yom (“dia”) pode ter usos diversos no hebraico bíblico; seu sentido aqui deve ser avaliado pela fórmula, sequência e contexto, não pelo dicionário isolado.',
'Versículo 3: Deus fala e a luz existe; não há esforço ou resistência. Versículo 4: Deus reconhece a luz como boa e estabelece uma distinção funcional. Versículo 5: Deus nomeia os períodos e conclui o primeiro dia. TEXTO: Deus ordena luz e tempo. INTERPRETAÇÃO: a natureza e duração dos dias são debatidas. APLICAÇÃO: a Palavra de Deus merece confiança e obediência.',
'Autoridade divina, criação pela Palavra, bondade, ordem e tempo pertencente a Deus são temas legítimos. A associação canônica entre luz e revelação é rica, mas o sentido primário aqui é a luz criada, não uma alegoria da conversão.',
'Existem diferentes interpretações cristãs sobre “tarde e manhã”: dias solares comuns, dias analógicos, estrutura literária ou períodos. O texto apresenta uma sequência ordenada; a discussão sobre duração deve ser conduzida com caridade e sem apagar a mensagem central.',
'A passagem não identifica a luz com Cristo em seu sentido histórico imediato, embora João use a linguagem de luz teologicamente. Não ensina astrologia, não descreve a fonte física da luz e não promete que declarar palavras positivas cria realidade como a palavra soberana de Deus.',
'Salmos 33:6,9 relaciona a palavra divina à criação. 2 Coríntios 4:6 usa o Deus que ordenou luz como analogia explícita da iluminação do evangelho. João 1:4-9 desenvolve a luz em relação ao Verbo e à vida. Apocalipse 22:5 aponta para a consumação em que o Senhor ilumina seu povo.',
'2 Coríntios 4:6 oferece uma conexão apostólica explícita entre a luz criadora e a iluminação do conhecimento da glória de Deus na face de Cristo. Isso é analogia canônica autorizada; não significa que cada detalhe do primeiro dia seja uma profecia direta.',
'A palavra de Deus é eficaz. A ordem criada recebe distinções boas. O tempo é dádiva e responsabilidade. A bondade é definida pela avaliação do Criador. A criatura responde à Palavra; não a controla.',
'Vida pessoal: submeter agenda e decisões à Palavra. Família: cultivar ritmos de trabalho e descanso. Igreja: anunciar a luz do evangelho com base apostólica. Liderança: criar clareza sem confundir ordem com controle autoritário. Evangelização: apontar para Cristo, não para técnicas de confissão positiva. Vida espiritual: receber a verdade que expõe trevas interiores.',
'Que verbos revelam a iniciativa de Deus? Por que a avaliação “boa” importa? Onde confundo a Palavra soberana de Deus com o poder das minhas próprias palavras? Como uso o tempo que Deus me concede?',
'TEXTO: Gênesis 1:3-5. TEMA: A Palavra que traz luz e ordem. IDEIA CENTRAL: Deus cria e ordena pela sua palavra eficaz. OBJETIVO: chamar ouvintes a confiar e obedecer à Palavra. INTRODUÇÃO: muitas palavras prometem mudança; somente a palavra do Criador chama a luz à existência. PONTOS: Deus fala; Deus avalia e separa; Deus nomeia o tempo. APLICAÇÕES: confiança, discernimento e mordomia do tempo. CONCLUSÃO: a luz do Criador prepara a leitura canônica da luz do evangelho.',
'Tema: “Quando Deus fala”. 1) Sua Palavra é eficaz (v.3). 2) Sua avaliação define o bem (v.4). 3) Sua ordem dá ritmo à vida (v.5). Aplicação: ouça a Escritura, examine o que chama de bom e consagre seu tempo. Conclusão: o Deus que disse “haja luz” ilumina corações por meio do evangelho, conforme 2 Coríntios 4:6.',
'Evite atribuir poder criador às palavras humanas; usar “luz” como símbolo sem primeiro explicar seu sentido narrativo; resolver o debate dos dias por uma única palavra; sugerir que trevas sejam um deus ou matéria moralmente má.',
'Mapeie todos os verbos e seus sujeitos. Explique a relação entre ordem e cumprimento. Em seguida, prepare uma introdução que conduza ao texto sem usar uma ilustração como prova.',
'Senhor, ensina-me a ouvir tua Palavra, chamar de bom aquilo que tu avalias como bom e administrar meus dias diante de ti. Faz brilhar em meu coração a luz do evangelho de Cristo. Amém.',
'A primeira fala registrada de Deus convida o pregador a depender menos da força de sua voz e mais da verdade da Palavra que proclama.',ARRAY['Gênesis 1:3-5','Salmos 33:6-9','João 1:4-9','2 Coríntios 4:6','Apocalipse 22:5']),
('a1000001-0000-4000-8000-000000000006','Gênesis 1:6-8','Segundo dia',
'Compreender a função da expansão na organização da criação e aprender a respeitar a linguagem fenomenológica e o horizonte do leitor antigo.',
'Deus ordena uma expansão entre as águas, separa águas de águas, realiza a separação e chama a expansão de céus. O segundo dia cria um espaço no qual, mais tarde, as aves se moverão.',
'Observe “haja”, “separe”, “fez”, “separou” e “chamou”. A ordem é cumprida. A palavra “águas” aparece repetidamente; a expansão é definida por sua função de separar. Diferentemente de outros dias, a fórmula “Deus viu que era bom” não aparece aqui, mas a avaliação geral de 1:31 inclui toda a obra.',
'Vem depois da separação entre luz e trevas e antes da reunião das águas inferiores. No arranjo do capítulo, o segundo dia estabelece o domínio dos céus, que será preenchido pelas aves no quinto dia.',
'A separação de águas participa do tema de Deus ordenar um mundo habitável. Mais tarde, águas e limites reaparecem no dilúvio, quando a ordem criada é dramaticamente desfeita e restaurada.',
'FATO: o texto comunica por imagens do mundo percebido por seus primeiros ouvintes. INTERPRETAÇÃO ACADÊMICA: muitos descrevem essa visão como uma expansão que retém águas superiores. HIPÓTESE: definir sua composição física exata ou converter a descrição em modelo científico detalhado excede o objetivo da narrativa.',
'No antigo Oriente Próximo, águas podiam simbolizar ameaça e desordem e eram integradas a diferentes cosmologias. Em Gênesis, elas não são divinas nem rivais independentes; obedecem ao comando do único Criador.',
'A repetição do propósito (“para separar”) e do cumprimento enfatiza função. O nome “céus” liga esta unidade ao resumo “céus e terra” e ao espaço que receberá luminares e aves.',
'Raqia é tradicionalmente traduzido “firmamento” ou “expansão”. O termo descreve o espaço estendido que separa águas; debates sobre materialidade não devem ser resolvidos apenas pela etimologia. Shamayim (“céus”) pode designar o céu visível ou, em outros contextos, a esfera celestial; aqui nomeia a expansão criada.',
'Versículo 6 apresenta a ordem e a função. Versículo 7 registra a ação e o cumprimento. Versículo 8 nomeia o domínio e encerra o dia. TEXTO: Deus organiza o espaço. INTERPRETAÇÃO: modelos da cosmologia antiga ajudam a compreender a linguagem, mas divergem em detalhes. APLICAÇÃO: o leitor confessa o governo de Deus sem transformar a Bíblia em manual de física.',
'A passagem trata de soberania, ordem e limites. Não oferece sozinha uma doutrina completa do céu espiritual. A ausência da avaliação “bom” não autoriza chamar o segundo dia de mau ou incompleto.',
'Existem diferentes interpretações sobre a natureza da expansão: estrutura sólida conforme certas reconstruções antigas, extensão atmosférica ou linguagem observacional não comprometida com uma descrição material. Todas devem prestar contas ao uso do termo e à função narrativa.',
'O texto não ensina que Deus habita fisicamente acima de uma cúpula, não fornece mapa científico da atmosfera e não declara as águas malignas. Também não sustenta desprezo pelo conhecimento científico.',
'Salmos 19:1 celebra os céus como testemunho da glória de Deus. Salmos 104:2-3 usa linguagem poética de estender os céus e estabelecer aposentos sobre as águas. Gênesis 7:11 retoma águas e comportas no relato do dilúvio. 2 Pedro 3:5 recorda que a terra foi formada da água e por meio da água.',
'Não há profecia direta de Cristo nesta unidade. A conexão é canônica: João 1:3 e Colossenses 1:16 atribuem a criação de todas as coisas ao Filho. Deve-se evitar transformar a expansão em símbolo da cruz.',
'Deus estabelece limites com propósito. A criação é ordenada e dependente. Linguagem verdadeira pode ser observacional sem ser um tratado técnico. A fidelidade requer humildade diante de reconstruções incertas.',
'Vida pessoal: aceitar limites criados. Família: ensinar reverência e curiosidade sem falso conflito. Igreja: distinguir confissão teológica de modelo científico. Liderança: comunicar graus de certeza. Serviço: cuidar do espaço comum. Evangelização: manter Cristo no centro, não uma disputa cosmológica.',
'O que a repetição de “separar” ensina? Qual é a função da expansão? Onde tenho tratado hipótese como certeza? Como comunicar convicção e humildade ao mesmo tempo?',
'TEXTO: Gênesis 1:6-8. TEMA: O Deus que estabelece espaços e limites. IDEIA CENTRAL: Deus organiza a criação para cumprir seu propósito. OBJETIVO: formar confiança no Criador e humildade interpretativa. PONTOS: a ordem revela intenção; o cumprimento revela autoridade; a nomeação revela governo.',
'Tema: “Limites sob a Palavra”. 1) Deus define a função do espaço (v.6). 2) Deus realiza o que ordena (v.7). 3) Deus nomeia seu domínio (v.8). Aplicação: receber limites e falar com honestidade sobre o que sabemos. Conclusão: céus proclamam a glória do Criador, não a autossuficiência humana.',
'Evite importar diagramas modernos ou antigos como se fossem o próprio texto; construir doutrina da ausência de “bom”; alegorizar águas superiores e inferiores; ridicularizar leitores cristãos que adotam outra reconstrução cosmológica.',
'Desenhe a estrutura da passagem somente com palavras do texto. Depois escreva três frases: uma certeza textual, uma interpretação provável e uma hipótese que deve permanecer aberta.',
'Criador dos céus, dá-me reverência por tua obra, disciplina para observar o texto e humildade para não dizer mais do que revelaste. Ensina-me a receber teus limites como sabedoria. Amém.',
'O pregador fiel não precisa esconder perguntas difíceis; ele precisa nomear com clareza o que o texto afirma e o grau de certeza de suas explicações.',ARRAY['Gênesis 1:6-8','Salmos 19:1','Salmos 104:2-3','Gênesis 7:11','2 Pedro 3:5','Colossenses 1:16']),
('a1000001-0000-4000-8000-000000000009','Gênesis 1:9-13','Terceiro dia — terra e vegetação',
'Perceber como Deus estabelece limites para terra e mares e concede à terra capacidade de produzir vegetação, unindo ordem, fecundidade e provisão.',
'As águas abaixo dos céus são reunidas, a porção seca aparece e ambos os domínios recebem nomes. Deus avalia essa organização como boa. Em seguida, ordena vegetação com semente e fruto, a terra produz e Deus novamente avalia como bom.',
'Marque duas ordens (“ajuntem-se”; “produza”), dois cumprimentos e duas avaliações. Observe terra/mares, erva/árvore, semente/fruto e a repetição “segundo a sua espécie”. A terra é agente secundário porque produz em resposta à ordem de Deus.',
'A unidade completa a formação dos domínios iniciada nos dias anteriores. A terra seca será ocupada por animais e seres humanos no sexto dia. A vegetação antecede sua designação como alimento em 1:29-30.',
'Terra, semente e fruto serão temas importantes em Gênesis: jardim, lavoura, fome, promessa de descendência e terra. Aqui, porém, o primeiro sentido é a fecundidade ordenada da criação.',
'FATO: agricultura, sementes e ciclos de produção eram vitais para sociedades antigas. INTERPRETAÇÃO: o texto apresenta uma ordem teológica da provisão. HIPÓTESE: identificar cada categoria hebraica com classificações botânicas modernas não é necessário nem seguro.',
'A distinção entre terra e mar comunica um mundo habitável. Povos antigos dependiam de chuvas, solos e colheitas e frequentemente divinizavam forças da fertilidade. Gênesis atribui fecundidade à palavra do Criador, não a rituais dirigidos a divindades agrícolas.',
'O terceiro dia possui duas obras, paralelas às duas obras do sexto. A fórmula “segundo a sua espécie” destaca continuidade ordenada. A dupla avaliação “bom” conclui tanto os limites quanto a fecundidade.',
'Yabbashah significa porção seca; erets, aqui, nomeia a terra. Deshe é vegetação tenra; esev pode designar plantas; ets peri, árvore frutífera. Min, “espécie/tipo”, é categoria textual ampla e não equivale automaticamente ao conceito taxonômico moderno de espécie biológica.',
'Versículos 9-10: Deus reúne águas e faz aparecer terra seca; nomeia e avalia. Versículos 11-12: Deus ordena vegetação capaz de reprodução e a terra responde. Versículo 13 encerra o dia. TEXTO: limites e fecundidade procedem de Deus. INTERPRETAÇÃO: relações com ciência dependem de modelos externos. APLICAÇÃO: receber e cuidar da provisão criada.',
'Deus governa limites e fecundidade. A bondade material é afirmada. A criação possui capacidades concedidas e dependentes. Provisão não significa garantia de abundância individual sem considerar queda, trabalho, injustiça e providência.',
'Existem diferentes leituras da relação entre a sequência narrativa e cronologias naturais. Alguns a tomam em ordem estritamente temporal; outros veem arranjo literário ou analógico. Nenhuma leitura deve apagar a afirmação de que Deus é fonte e Senhor da fecundidade.',
'O texto não promete colheitas abundantes a toda pessoa fiel, não define taxonomia científica por “espécie” e não autoriza exploração ilimitada da terra. A terra produz porque Deus ordena; ela não é uma deusa autônoma.',
'Salmos 104:5-14 celebra limites das águas e provisão vegetal. Salmos 148:7-10 convoca mar, árvores e criaturas ao louvor. Gênesis 8:22 fala da continuidade de semeadura e colheita após o dilúvio. Marcos 4:26-29 usa o crescimento da semente em parábola do reino, sem redefinir Gênesis 1.',
'Cristo não é alegorizado como cada semente desta passagem. A conexão canônica está em Colossenses 1:16-17: a criação existe por meio dele e nele subsiste. No Novo Testamento, imagens de semente ganham usos próprios que devem ser interpretados em seus contextos.',
'Deus transforma espaço em lugar habitável. Limites podem servir à vida. A fecundidade é dom, não divindade. A matéria criada é boa. Provisão recebida implica gratidão e responsabilidade.',
'Vida pessoal: gratidão e sobriedade no consumo. Família: evitar desperdício. Igreja: cuidado da criação ligado ao amor ao próximo. Liderança: não prometer prosperidade automática. Serviço: apoiar quem sofre escassez. Evangelização: apresentar o Doador acima dos dons. Vida espiritual: cultivar fruto coerente com arrependimento, sem confundir metáfora com exegese primária.',
'Por que a passagem repete “bom”? Como limites favorecem vida? Que diferença existe entre receber a terra como dom e tratá-la como propriedade absoluta? Onde preciso trocar desperdício por mordomia?',
'TEXTO: Gênesis 1:9-13. TEMA: O Deus que dá lugar e provisão. IDEIA CENTRAL: pela Palavra, Deus ordena a terra e a torna fecunda para seus propósitos. OBJETIVO: conduzir a gratidão responsável. PONTOS: Deus estabelece limites; Deus concede fecundidade; Deus avalia sua obra como boa.',
'Tema: “Terra que responde ao Criador”. 1) Limites que tornam a vida possível (vv.9-10). 2) Fecundidade que nasce da ordem divina (vv.11-12). 3) Bondade que chama à mordomia (vv.10,12). Conclusão: recebemos a criação como dádiva e responsabilidade.',
'Evite prometer riqueza agrícola ou financeira; equiparar min à taxonomia moderna; tratar natureza como divina; usar parábolas de semente como se fossem explicação histórica de Gênesis; ignorar a responsabilidade humana pelo cuidado.',
'Liste as duas ordens, os cumprimentos e avaliações. Formule a ideia central sem usar as palavras “eu” ou “nós”. Depois derive uma aplicação que respeite a diferença entre criação e promessa pessoal.',
'Deus provedor, obrigado pela terra, pela semente e pelo fruto. Perdoa nosso desperdício e nossa exploração. Ensina-nos a receber teus dons com gratidão e a administrá-los em amor. Amém.',
'A boa pregação da criação não termina em admiração abstrata; conduz o povo a agradecer, repartir e cuidar do mundo que pertence a Deus.',ARRAY['Gênesis 1:9-13','Salmos 104:5-14','Salmos 148:7-10','Gênesis 8:22','Colossenses 1:16-17','Marcos 4:26-29']),
('a1000001-0000-4000-8000-000000000014','Gênesis 1:14-19','Quarto dia — luminares',
'Entender os luminares como criaturas subordinadas a Deus e servas da ordem temporal, rejeitando tanto idolatria quanto especulação que substitua a mensagem do texto.',
'Deus coloca luminares na expansão para separar dia e noite, marcar sinais, tempos determinados, dias e anos, iluminar a terra e governar os períodos. O texto menciona o maior, o menor e as estrelas sem apresentá-los como divinos.',
'Observe os verbos de função: separar, servir, iluminar e governar. Note “dois grandes luminares”, “maior”, “menor” e a frase breve “e fez também as estrelas”. Compare com o primeiro dia: domínios de luz e trevas agora recebem governantes criados.',
'A passagem preenche o domínio estabelecido no primeiro dia e utiliza a expansão do segundo. Depois, o quinto dia preencherá águas e céus com seres vivos. Os luminares organizam o tempo para a vida criada.',
'Gênesis desenvolverá calendários, estações, festas e sinais celestes, mas sempre sob o governo de Deus. O sol que ilumina patriarcas e povos não é uma divindade concorrente.',
'FATO: calendários antigos dependiam de ciclos solares e lunares. INTERPRETAÇÃO: a ausência dos nomes comuns “sol” e “lua” pode reduzir associações com divindades adoradas por povos vizinhos. HIPÓTESE: afirmar uma polêmica dirigida a um culto específico sem evidência adicional vai além do texto.',
'Sol, lua e estrelas eram divinizados em várias culturas antigas e usados para calendários e presságios. Gênesis os apresenta como obras com tarefas determinadas. “Sinais” no contexto inclui marcação ordenada; não legitima astrologia ou horóscopos.',
'A unidade acumula finalidades antes de narrar o cumprimento. O paralelismo dias 1/4 evidencia domínios e seus governantes. A descrição funcional é proeminente: o texto pergunta para que servem dentro da ordem de Deus.',
'Meorot significa luminares, fontes de luz no céu percebido. Moadim pode indicar tempos determinados, estações e, em outros contextos, ocasiões festivas. Mashal, “governar”, descreve função delegada sobre dia e noite, não soberania independente.',
'Versículos 14-15 registram ordem e propósitos. Versículo 16 distingue luminares e menciona estrelas. Versículos 17-18 reiteram posição e função; Deus avalia como bom. Versículo 19 encerra o dia. TEXTO: corpos celestes são criaturas funcionais. INTERPRETAÇÃO: possível dimensão anti-idolátrica. APLICAÇÃO: adorar o Criador e usar o tempo com sabedoria.',
'A passagem sustenta criação, providência, ordem temporal e rejeição da idolatria. Governo criado é delegado e limitado. “Sinais” não fundamenta determinismo astral.',
'Existem leituras diversas sobre como conciliar a luz do primeiro dia com os luminares do quarto: criação posterior dos astros, aparecimento funcional, estrutura literária ou linguagem fenomenológica. O texto enfatiza autoridade e função; não explica todos os mecanismos.',
'O texto não ensina astrologia, não diz que estrelas determinam caráter ou destino e não identifica eclipses modernos automaticamente como mensagens proféticas. Também não reduz os luminares a meras ilusões.',
'Salmos 19:1-6 descreve os céus proclamando a glória de Deus sem divinizar o sol. Deuteronômio 4:19 proíbe adorar corpos celestes. Salmos 136:7-9 louva Deus pelos grandes luminares. Jeremias 10:2 adverte contra temer sinais dos céus como as nações. Apocalipse 21:23 declara que a glória de Deus ilumina a cidade e o Cordeiro é sua lâmpada.',
'Não há profecia direta de Cristo nos luminares. A conexão canônica aparece na consumação: Apocalipse 21:23 apresenta o Cordeiro como lâmpada da nova Jerusalém. Isso não torna o sol uma alegoria de Cristo em Gênesis 1.',
'O tempo pertence a Deus. Criaturas poderosas continuam criaturas. Funções e autoridade são delegadas. A ordem criada serve à vida e ao culto, não ao fatalismo.',
'Vida pessoal: abandonar horóscopos e administrar o tempo. Família: marcar ritmos de culto e descanso. Igreja: discernir sensacionalismo profético. Liderança: exercer autoridade delegada com limites. Serviço: organizar tempo em favor do próximo. Evangelização: apontar da criação ao Criador, não prever destinos pelas estrelas.',
'O que os luminares fazem segundo o texto? Como sua função corrige idolatria? Onde busco controle por sinais? Como meu calendário pode testemunhar que meu tempo pertence a Deus?',
'TEXTO: Gênesis 1:14-19. TEMA: Luzes que servem ao Criador. IDEIA CENTRAL: Deus estabelece os luminares como servos da ordem, não objetos de adoração. OBJETIVO: libertar da idolatria e formar mordomia do tempo. PONTOS: criaturas designadas; funções delimitadas; bondade reconhecida.',
'Tema: “Quando as luzes deixam de ser deuses”. 1) Deus determina suas funções (vv.14-15). 2) Deus estabelece sua autoridade limitada (v.16). 3) Deus as coloca a serviço da terra (vv.17-18). Conclusão: não tema nem adore a criação; receba seus ritmos sob o Senhor.',
'Evite astrologia cristianizada; marcar datas do fim a partir de eventos celestes; afirmar intenção polêmica específica como certeza; tratar “governar” como soberania divina dos astros; usar Apocalipse para apagar o sentido de Gênesis.',
'Faça uma lista de todas as finalidades introduzidas por “para”. Depois prepare uma aplicação contra idolatria contemporânea que nasça dessas funções, não de medo ou sensacionalismo.',
'Senhor dos tempos, livra-me de temer ou adorar o que criaste. Ensina-me a contar meus dias, usar meus ritmos para tua glória e repousar em teu governo. Amém.',
'Os astros impressionam, mas o texto os reduz à condição correta: grandes aos nossos olhos, servos diante de Deus.',ARRAY['Gênesis 1:14-19','Salmos 19:1-6','Deuteronômio 4:19','Salmos 136:7-9','Jeremias 10:2','Apocalipse 21:23']),
('a1000001-0000-4000-8000-000000000020','Gênesis 1:20-23','Quinto dia — criaturas marinhas e aves',
'Contemplar a abundância da vida criada, compreender a bênção de fecundidade e rejeitar leituras que divinizem ou demonizem criaturas do mar.',
'Deus ordena que as águas fervilhem de seres vivos e que aves voem. Cria grandes criaturas marinhas e toda variedade aquática e alada, avalia como bom e pronuncia a primeira bênção explícita: frutificar, multiplicar e encher.',
'Observe “fervilhem”, “voem”, “criou”, “viu”, “abençoou”, “frutificai”, “multiplicai” e “enchei”. A abundância cresce. “Segundo suas espécies” aparece duas vezes. A bênção comunica capacidade e comissão concedidas por Deus.',
'A unidade preenche os domínios das águas e céus formados nos dias dois e três. Depois, animais terrestres e seres humanos preencherão a terra. A bênção antecipará a bênção humana em 1:28.',
'Vida, bênção e multiplicação atravessam Gênesis. Após o dilúvio, Deus renovará linguagem semelhante em Gênesis 8–9. A fecundidade é dom do Criador, não poder autônomo.',
'FATO: mares eram fonte de alimento, viagem e perigo para povos antigos. INTERPRETAÇÃO: a menção das grandes criaturas marinhas pode comunicar que até seres temidos pertencem à criação de Deus. HIPÓTESE: identificar tanninim com uma espécie moderna específica não é possível com segurança.',
'Em mitologias vizinhas, monstros marinhos podiam representar poderes caóticos em conflito com deuses. Em Gênesis, as grandes criaturas são simplesmente criadas por Deus e declaradas boas; não aparecem como rivais divinos.',
'A passagem intensifica o vocabulário de vida e introduz bênção direta. O quinto dia corresponde ao segundo: o espaço celeste e aquático é agora preenchido. A fórmula do dia mantém a unidade do capítulo.',
'Sherets descreve enxamear ou abundar. Nephesh hayyah significa ser vivente/criatura viva e não deve ser reduzido automaticamente ao conceito filosófico posterior de “alma”. Tanninim gedolim são grandes criaturas marinhas; a palavra pode variar conforme o contexto. Barakh, abençoar, aqui concede fecundidade e missão.',
'Versículo 20 contém a ordem de abundância. Versículo 21 atribui diretamente a Deus a criação de todas essas criaturas e registra a avaliação. Versículo 22 pronuncia bênção. Versículo 23 encerra o dia. TEXTO: Deus cria e abençoa vida abundante. INTERPRETAÇÃO: há provável contraste com mitos de monstros divinizados. APLICAÇÃO: honrar a vida criada sem adorá-la.',
'Deus é fonte da vida e da bênção. A diversidade criada é boa. Fecundidade é capacidade concedida. Criaturas temidas não rivalizam com o Criador.',
'Existem interpretações diferentes sobre a relação entre as categorias “segundo suas espécies” e a biologia moderna. O texto classifica criaturas de modo compreensível à narrativa e não oferece uma taxonomia genética.',
'O texto não promete fecundidade biológica igual a todos os indivíduos, não chama animais de deuses, não define cada espécie científica e não autoriza crueldade por serem criaturas inferiores.',
'Salmos 104:24-26 celebra a multiplicidade do mar, inclusive o Leviatã como criatura de Deus. Salmos 148:7,10 convoca criaturas marinhas e aves ao louvor. Gênesis 8:17 repete multiplicação após o dilúvio. Mateus 6:26 usa as aves para ensinar confiança na provisão do Pai, em contexto próprio.',
'Cristo não deve ser identificado alegoricamente com uma ave ou criatura marinha. Colossenses 1:16 oferece a conexão canônica: todas as coisas visíveis foram criadas por meio dele e para ele.',
'A vida é dom. A bênção capacita para cumprir propósito. Diversidade não ameaça a soberania de Deus. Temor da criatura deve ceder à confiança no Criador.',
'Vida pessoal: maravilhar-se sem idolatrar. Família: ensinar cuidado dos animais. Igreja: celebrar a generosidade da vida. Liderança: não usar “frutificar” como pressão cruel sobre casais. Serviço: proteger ambientes dos quais comunidades dependem. Evangelização: anunciar o Criador de toda vida.',
'O que muda quando Deus abençoa? Por que o texto menciona grandes criaturas? Como evitar tanto idolatria da natureza quanto desprezo por ela? Onde preciso receber vida como dom?',
'TEXTO: Gênesis 1:20-23. TEMA: Vida abundante sob a bênção. IDEIA CENTRAL: Deus cria, avalia e abençoa a diversidade de seres vivos. OBJETIVO: formar admiração responsável. PONTOS: vida pela Palavra; diversidade declarada boa; fecundidade como bênção.',
'Tema: “O mar também pertence a Deus”. 1) A Palavra chama vida abundante (v.20). 2) O Criador governa até o que inspira temor (v.21). 3) A bênção conduz ao propósito (v.22). Conclusão: receba, respeite e celebre a vida diante do Doador.',
'Evite identificar criaturas modernas com certeza indevida; demonizar todo simbolismo marinho; impor fecundidade como medida de valor pessoal; confundir cuidado da criação com adoração da criação.',
'Compare ordem, cumprimento, avaliação e bênção. Explique em suas palavras a diferença entre bênção e avaliação. Prepare uma aplicação pastoral para alguém que sofre com infertilidade sem ferir o sentido do texto.',
'Deus da vida, recebe nosso louvor pela diversidade de tua obra. Livra-nos do medo, da idolatria e da crueldade. Ensina-nos a cuidar do que declaraste bom. Amém.',
'O pregador contempla a abundância criada para ampliar a adoração, não para reduzir a passagem a curiosidades sobre animais.',ARRAY['Gênesis 1:20-23','Salmos 104:24-26','Salmos 148:7-10','Gênesis 8:17','Mateus 6:26','Colossenses 1:16']),
('a1000001-0000-4000-8000-000000000024','Gênesis 1:24-25','Animais terrestres',
'Observar a criação ordenada dos animais terrestres e desenvolver uma ética de criatura: domínio humano responsável sem exploração ou divinização.',
'Deus ordena que a terra produza seres vivos segundo suas espécies: animais domésticos, seres que se movem junto ao chão e animais selvagens. A ordem se cumpre; Deus faz as criaturas e as avalia como boas.',
'Identifique a ordem e seu cumprimento. Compare as três categorias e a repetição “segundo sua espécie”. Note que a terra produz por ordem de Deus e que o próprio Deus “faz”; agência criada e ação divina não competem na narrativa.',
'A passagem abre o sexto dia e prepara imediatamente a criação humana. Animais e humanos compartilham o domínio terrestre e recebem alimento vegetal em 1:29-30, mas somente a humanidade é chamada imagem de Deus.',
'Animais aparecem em criação, queda, dilúvio, sacrifícios e economia patriarcal. A distinção aqui entre categorias serve à narrativa e ao ambiente humano, não a um catálogo zoológico moderno.',
'FATO: criação de rebanhos e convivência com animais selvagens eram centrais à vida antiga. INTERPRETAÇÃO: as categorias refletem perspectiva cotidiana do observador. HIPÓTESE: mapear cada termo para uma ordem zoológica moderna é anacrônico.',
'Behemah costuma abranger animais domésticos ou de grande porte; remes, seres que se movem junto ao chão; hayyat haarets, animais da terra, frequentemente selvagens. As categorias são funcionais e observacionais.',
'A unidade é breve e deliberadamente paralela ao terceiro dia, quando a terra produziu vegetação. Sua concisão desloca o foco narrativo para a criação humana que se segue, sem diminuir a bondade dos animais.',
'Nephesh hayyah, “ser vivente”, também é usado para outras criaturas e alerta contra supor que toda ocorrência tenha definição antropológica técnica. Asah, “fez”, e a ordem para a terra produzir aparecem juntas; o texto mantém causalidade divina e meios criados.',
'Versículo 24 registra ordem, categorias e cumprimento. Versículo 25 reexpressa a ação de Deus e sua avaliação. TEXTO: diversidade animal é obra boa de Deus. INTERPRETAÇÃO: categorias são antigas e amplas. APLICAÇÃO: seres humanos devem exercer responsabilidade coerente com a bondade do Criador.',
'Bondade da criação animal, soberania e diversidade são temas centrais. A distinção entre humanidade e animais será dada no próximo parágrafo pela imagem e vocação, não por negar valor aos animais.',
'Diferentes cristãos relacionam “segundo suas espécies” a modelos distintos de origem e desenvolvimento biológico. A expressão afirma reprodução ordenada no nível do discurso, mas não resolve por si só todos os mecanismos científicos.',
'O texto não ensina que animais sejam moralmente culpados, não dá licença para crueldade, não os torna iguais a Deus e não oferece uma classificação científica completa.',
'Salmos 104:10-23 descreve a provisão de Deus para animais. Jó 38:39–39:30 amplia a visão para criaturas além do controle humano. Provérbios 12:10 relaciona justiça ao cuidado dos animais. Gênesis 9:8-10 inclui criaturas na aliança após o dilúvio.',
'Não há tipo ou profecia direta de Cristo nesta breve unidade. A conexão canônica é que o Filho é agente e alvo da criação, Colossenses 1:16, e o propósito final inclui reconciliação cósmica, Colossenses 1:20.',
'Cada criatura tem valor derivado do Criador. Diversidade e ordem coexistem. Agência natural não elimina dependência de Deus. Domínio humano deve aguardar 1:26-28 e ser lido como vocação responsável.',
'Vida pessoal: tratar criaturas sem crueldade. Família: ensinar cuidado. Igreja: evitar indiferença a práticas destrutivas. Liderança: exercer poder como mordomia. Serviço: considerar efeitos ambientais sobre pobres. Evangelização: apontar da bondade criada ao Doador.',
'O que a passagem repete? Como Deus e terra aparecem agindo sem competição? Por que a avaliação divina limita nossa exploração? O que muda quando vejo animais como criaturas e não objetos absolutos?',
'TEXTO: Gênesis 1:24-25. TEMA: Criaturas boas sob o cuidado de Deus. IDEIA CENTRAL: Deus chama à existência uma diversidade animal ordenada e boa. OBJETIVO: formar reverência e mordomia. PONTOS: ordem; diversidade; avaliação.',
'Tema: “O valor que vem do Criador”. 1) A terra responde à Palavra (v.24). 2) A diversidade permanece sob Deus (vv.24-25). 3) A avaliação divina define nosso trato (v.25). Conclusão: cuidar sem idolatrar e usar sem destruir.',
'Evite transformar categorias antigas em taxonomia moderna; defender crueldade pelo domínio do versículo seguinte; pregar animais como símbolos secretos; introduzir debates científicos sem explicar primeiro a passagem.',
'Classifique suas afirmações em observação, inferência e aplicação. Depois formule uma aplicação sobre uso de poder que se baseie na avaliação “bom”.',
'Criador bondoso, dá-nos olhos para reconhecer o valor de tua obra e mãos responsáveis para cuidar dela. Livra-nos da crueldade, do desperdício e da idolatria. Amém.',
'A brevidade da passagem não é insignificância: ela prepara o pregador para falar da humanidade sem esquecer que compartilhamos uma terra cheia de criaturas que Deus chama boas.',ARRAY['Gênesis 1:24-25','Salmos 104:10-23','Jó 38:39-39:30','Provérbios 12:10','Gênesis 9:8-10','Colossenses 1:16-20']),
('a1000001-0000-4000-8000-000000000026','Gênesis 1:26-31','O ser humano criado à imagem de Deus',
'Compreender a dignidade e a vocação de homem e mulher como imagem de Deus, interpretar domínio como mordomia responsável e preparar uma mensagem fiel sem usar o texto para justificar abuso.',
'Deus anuncia a criação humana à sua imagem e semelhança e associa essa identidade a uma vocação sobre as criaturas. Deus cria a humanidade, explicita homem e mulher, abençoa, ordena fecundidade e domínio, concede alimento e avalia o conjunto como “muito bom”.',
'Observe a mudança de “haja” para “façamos”, a tríplice repetição de “criou” no versículo 27, o paralelismo imagem/homem e mulher e os imperativos da bênção. Diferencie identidade recebida (“imagem”) e tarefa concedida (“domínio”). Todos os humanos do texto recebem dignidade; não apenas reis, homens ou líderes.',
'A passagem culmina o sexto dia após os animais terrestres. Gênesis 2 focalizará a humanidade de outra perspectiva; Gênesis 3 mostrará a corrupção do relacionamento e da vocação, não a eliminação da imagem. Gênesis 9:6 ainda fundamenta a proteção da vida humana na imagem de Deus após a queda.',
'Gênesis desenvolverá linhagens, violência, nações e promessa. A imagem fundamenta dignidade universal antes de distinções étnicas, sociais ou nacionais. A vocação humana situa patriarcas e Israel dentro do propósito mais amplo do Criador.',
'FATO: em contextos antigos, reis podiam ser descritos como imagem de uma divindade e imagens representavam autoridade. INTERPRETAÇÃO: Gênesis democratiza linguagem régia ao aplicá-la à humanidade, homem e mulher. HIPÓTESE: reconstruir uma cerimônia específica por trás de cada frase não pode ser afirmado com certeza.',
'A comissão de frutificar e governar se relaciona ao mundo agrário, familiar e comunitário, mas não reduz valor humano à fertilidade. Homem e mulher compartilham imagem e bênção. Domínio deve refletir o governo bom de Deus, não práticas imperiais de exploração.',
'O anúncio plural, o poema do versículo 27, a bênção e a provisão formam uma unidade culminante. A repetição “criou” destaca a ação divina; a passagem passa da deliberação à criação, da identidade à missão e da missão à provisão e avaliação.',
'Tselem, “imagem”, pode designar representação; demut, “semelhança”, reforça correspondência sem afirmar igualdade com Deus. Radah, “dominar”, e kabash, “sujeitar”, são termos fortes de governo; seu contexto é a representação do Criador que declara sua obra boa. Zakar uneqevah, “macho e fêmea”, afirma que ambos pertencem à humanidade criada à imagem. Nenhuma etimologia isolada define toda a doutrina.',
'Versículo 26: Deus anuncia identidade e vocação. Sobre “façamos”, TEXTO: há plural na fala e singular na execução. INTERPRETAÇÕES: deliberação divina, endereço à corte celestial ou, na leitura cristã canônica, compatibilidade com revelação trinitária posterior. O versículo sozinho não formula a Trindade. Versículo 27: Deus cria a humanidade à sua imagem, homem e mulher. Versículo 28: bênção e comissão. Versículos 29-30: provisão alimentar. Versículo 31: avaliação “muito bom”. APLICAÇÃO: honrar toda pessoa e exercer poder como mordomia.',
'Imagem de Deus, igualdade de dignidade entre homem e mulher, vocação humana, bênção, trabalho, comunidade e bondade criada são centrais. A imagem pode incluir dimensões representativas, relacionais e capacidades humanas; o texto liga claramente identidade à representação e ao domínio.',
'Existem diferentes interpretações cristãs sobre “façamos”: plural de deliberação, discurso à corte celestial ou indicação lida canonicamente à luz da Trindade. Sobre a imagem, propostas substantivas, relacionais e funcionais podem iluminar aspectos, mas nenhuma deve apagar o conjunto. Sobre domínio, há consenso textual de autoridade delegada, com debates sobre alcance e prática.',
'O texto não ensina superioridade étnica, masculina, econômica ou de pessoas sem deficiência. Não reduz a imagem à inteligência, não diz que quem não tem filhos perdeu a bênção e não autoriza violência contra pessoas, animais ou terra. Não é uma prova isolada e completa da Trindade.',
'Gênesis 5:1-3 retoma imagem e semelhança. Gênesis 9:6 protege a vida humana por causa da imagem. Salmos 8:4-8 celebra honra e responsabilidade humanas. Tiago 3:9 condena amaldiçoar pessoas feitas à semelhança de Deus. Colossenses 1:15 chama Cristo imagem do Deus invisível; Colossenses 3:10 e Efésios 4:24 relacionam renovação à nova humanidade. Hebreus 2:5-9 lê o destino humano à luz de Jesus.',
'Cristo é chamado explicitamente “imagem do Deus invisível” em Colossenses 1:15. Hebreus 2 aplica o Salmo 8 a Jesus, o humano fiel e coroado. A conexão é canônica: Cristo revela perfeitamente Deus e restaura a vocação humana. Não significa que Adão seja Cristo em cada detalhe nem que “façamos” sozinho prove a doutrina trinitária.',
'Toda pessoa possui dignidade derivada, não conquistada. Homem e mulher compartilham imagem e missão. Poder é responsabilidade representativa. Trabalho e cuidado pertencem à vocação criada. Bênção precede comissão. A criação material é muito boa, embora posteriormente afetada pelo pecado.',
'Vida pessoal: receber identidade de Deus, não de desempenho. Família: honrar homem, mulher, criança, idoso e pessoa com deficiência. Caráter: usar poder para servir. Igreja: rejeitar racismo, abuso e misoginia. Liderança: representar o governo justo de Deus. Serviço: proteger vida e cuidar da criação. Evangelização: anunciar restauração em Cristo. Vida espiritual: crescer na semelhança moral de Cristo sem confundir Criador e criatura.',
'O que é concedido antes de qualquer realização humana? Como identidade e missão se relacionam? Quem minha cultura trata como menos digno? Meu uso de autoridade reflete o caráter do Criador? Como Cristo ilumina e restaura a vocação humana?',
'TEXTO: Gênesis 1:26-31. TEMA: Imagem para representar o Rei. IDEIA CENTRAL: Deus concede a todo ser humano dignidade e vocação para representar seu governo bom na criação. OBJETIVO: levar a igreja a honrar pessoas e exercer poder como serviço. INTRODUÇÃO: o mundo mede valor por capacidade; Deus o concede por criação. PONTOS: identidade recebida; missão compartilhada; provisão e avaliação. APLICAÇÕES: dignidade, justiça, trabalho e cuidado. CONCLUSÃO: Cristo, imagem perfeita, renova seu povo.',
'Tema: “Dignidade recebida, missão confiada”. 1) Deus concede identidade: imagem e semelhança (vv.26-27). Explicação: representação sem igualdade divina. Aplicação: honrar toda pessoa. 2) Deus confia uma missão: frutificar e governar (v.28). Explicação: autoridade delegada. Aplicação: liderar servindo. 3) Deus provê e avalia: alimento e “muito bom” (vv.29-31). Aplicação: gratidão e cuidado. Conclusão: em Cristo, imagem perfeita, somos renovados para viver a vocação.',
'Evite usar “domínio” para legitimar abuso; limitar imagem a uma capacidade; excluir mulheres; prometer filhos a todos; ler a Trindade inteira no plural sem apoio canônico; ignorar o contexto literário; transformar “muito bom” em negação da queda posterior.',
'Antes de consultar o exemplo, formule a ideia central, mostre como cada ponto nasce de um versículo e escreva aplicações para uma criança, um líder e uma pessoa vulnerável. Revise se alguma aplicação justifica poder sem responsabilidade.',
'Deus, nosso Criador, obrigado pela dignidade que concedes a cada pessoa. Perdoa nosso abuso de poder e nosso desprezo pelo próximo. Conforma-nos a Cristo, tua imagem perfeita, para servirmos com justiça, amor e cuidado. Amém.',
'A formação do pregador começa aqui: quem fala em nome de Deus deve tratar cada ouvinte como portador de dignidade concedida por Deus e exercer toda autoridade como serviço responsável.',ARRAY['Gênesis 1:26-31','Gênesis 5:1-3','Gênesis 9:6','Salmos 8:4-8','Tiago 3:9','Colossenses 1:15','Colossenses 3:10','Efésios 4:24','Hebreus 2:5-9']);

INSERT INTO public.lesson_content (lesson_id,kind,title,body,scripture_refs,order_index)
SELECT s.lesson_id, v.kind, v.title, v.body, CASE WHEN v.with_refs THEN s.refs ELSE ARRAY[s.reference] END, v.ord
FROM genesis1_seed s
CROSS JOIN LATERAL (VALUES
 (1,'referencias','1. Referência bíblica',s.reference,true),
 (2,'introducao','2. Título',s.passage_title,false),
 (3,'objetivos','3. Objetivo da aula',s.objective,false),
 (4,'texto','4. Visão geral da passagem',s.overview,false),
 (5,'observacao','5. Leitura e observação',s.observation,false),
 (6,'contexto','6. Contexto imediato',s.immediate_context,false),
 (7,'contexto','7. Contexto do livro',s.book_context,false),
 (8,'contexto','8. Contexto histórico',s.historical,false),
 (9,'contexto_cultural','9. Contexto cultural',s.cultural,false),
 (10,'interpretacao','10. Contexto literário',s.literary,false),
 (11,'glossario','11. Palavras e termos importantes',s.terms,false),
 (12,'interpretacao','12. Explicação da passagem',s.explanation,true),
 (13,'principios','13. Questões teológicas',s.theology,false),
 (14,'interpretacao','14. Diferentes interpretações',s.interpretations,false),
 (15,'interpretacao','15. O que o texto não está dizendo',s.not_saying,false),
 (16,'referencias_cruzadas','16. Referências cruzadas',s.cross_refs,true),
 (17,'conexao_cristo','17. Relação com Cristo',s.christ,true),
 (18,'principios','18. Princípios bíblicos',s.principles,false),
 (19,'aplicacao','19. Aplicação',s.application,false),
 (20,'meditacao','20. Perguntas de meditação',s.meditation,false),
 (21,'meditacao','21. Campo de meditação do aluno','Use o Caderno do pregador abaixo e responda: “O que Deus me ensinou através deste estudo?” Seu registro é privado e pode ser atualizado.',false),
 (22,'exercicio','22. Teste de entendimento','Responda às perguntas de compreensão apresentadas após a leitura. Elas avaliam contexto, ideia central e limites interpretativos, não apenas memorização.',false),
 (23,'exercicio','23. Exercício de exegese','No Caderno do pregador, identifique contexto, observações textuais, ideia central, princípio e aplicação. Separe claramente observação, interpretação e aplicação.',false),
 (24,'pregacao','24. Preparação da pregação',s.sermon,true),
 (25,'pregacao','25. Exemplo de esboço',s.outline,true),
 (26,'interpretacao','26. Erros de interpretação a evitar',s.errors,false),
 (27,'desafio','27. Desafio do pregador',s.challenge,false),
 (28,'oracao','28. Oração',s.prayer,false),
 (29,'encerramento','29. Reflexão final',s.final_reflection,false)
) AS v(ord,kind,title,body,with_refs);

INSERT INTO public.lesson_questions (lesson_id,kind,prompt,options,answer_key,explanation,scripture_refs,order_index)
SELECT s.lesson_id,'reflexao',q.prompt,'[]'::jsonb,NULL,q.explanation,s.refs,q.ord
FROM genesis1_seed s
CROSS JOIN LATERAL (VALUES
 (1,'Qual é a ideia central desta passagem, expressa sem acrescentar uma hipótese externa?',s.objective),
 (2,'Quais observações do próprio texto sustentam essa ideia central?',s.observation),
 (3,'Qual distinção entre fato, interpretação e hipótese é mais importante nesta aula?',s.historical),
 (4,'Que erro interpretativo um pregador deve evitar e por quê?',s.errors)
) q(ord,prompt,explanation);

INSERT INTO public.lesson_exercises (lesson_id,kind,title,instructions,fields,order_index,status)
SELECT lesson_id,'observacao','Exercício de exegese','Trabalhe primeiro com a passagem. Registre evidências do texto antes de formular interpretações e aplicações.',
 jsonb_build_array(
  jsonb_build_object('key','contexto','label','Contexto da passagem','placeholder','O que vem antes e depois?'),
  jsonb_build_object('key','observacoes','label','Observações textuais','placeholder','Verbos, repetições, contrastes e estrutura.'),
  jsonb_build_object('key','ideia_central','label','Ideia central','placeholder','Uma frase sustentada pela passagem.'),
  jsonb_build_object('key','principio','label','Princípio bíblico','placeholder','Princípio que atravessa contextos.'),
  jsonb_build_object('key','aplicacao','label','Aplicação responsável','placeholder','Aplicação coerente, sem transformar narrativa em promessa pessoal.')
 ),1,'published'::public.content_status FROM genesis1_seed
UNION ALL
SELECT lesson_id,'pregacao','Prepare sua mensagem','Monte seu próprio esboço antes de consultar novamente o exemplo. Cada ponto deve nascer da passagem.',
 jsonb_build_array(
  jsonb_build_object('key','tema','label','Tema','placeholder','Título claro e fiel.'),
  jsonb_build_object('key','objetivo','label','Objetivo','placeholder','O que os ouvintes devem compreender ou praticar?'),
  jsonb_build_object('key','introducao','label','Introdução','placeholder','Conduza ao problema do texto.'),
  jsonb_build_object('key','pontos','label','Pontos e referências','placeholder','Desenvolva até três pontos nascidos dos versículos.'),
  jsonb_build_object('key','aplicacoes','label','Aplicações','placeholder','A quem se aplicam e com quais limites?'),
  jsonb_build_object('key','conclusao','label','Conclusão','placeholder','Retome a ideia central e a resposta esperada.')
 ),2,'published'::public.content_status FROM genesis1_seed;

INSERT INTO public.lesson_cross_references (lesson_id,reference,relation_kind,explanation,order_index)
SELECT s.lesson_id, ref, CASE WHEN ref LIKE 'Gênesis%' OR ref LIKE 'Salmos%' OR ref LIKE 'Isaías%' OR ref LIKE 'Jó%' OR ref LIKE 'Provérbios%' OR ref LIKE 'Deuteronômio%' OR ref LIKE 'Jeremias%' THEN 'antigo_testamento' ELSE 'novo_testamento' END,
 'Referência selecionada por sua relação textual ou canônica direta com ' || s.reference || '; a explicação detalhada está na seção de referências cruzadas.', ord
FROM genesis1_seed s, unnest(s.refs) WITH ORDINALITY r(ref,ord)
WHERE ref <> s.reference;

INSERT INTO public.content_sources (lesson_id,kind,title,author,detail,url,order_index)
SELECT lesson_id,'texto_biblico','Texto hebraico de Gênesis 1','Bíblia Hebraica','Referência ao texto massorético para conferência de vocabulário e estrutura; nenhuma tradução moderna protegida foi reproduzida.',NULL,1 FROM genesis1_seed
UNION ALL
SELECT lesson_id,'lexico','Léxico do Antigo Testamento','Brown, Driver e Briggs','Obra de referência lexical em domínio público, consultada com atenção ao uso contextual e sem derivar doutrina de etimologia isolada.','https://archive.org/details/hebrewenglishlex00browuoft',2 FROM genesis1_seed
UNION ALL
SELECT lesson_id,'historico','Contexto do antigo Oriente Próximo','Síntese editorial original','Paralelos culturais são apresentados como contexto comparativo, com graus de certeza explícitos e sem alegar dependência literária não demonstrada.',NULL,3 FROM genesis1_seed
UNION ALL
SELECT lesson_id,'biblico','Referências canônicas','Caminhando com Cristo','Seleção de passagens bíblicas relacionadas, verificadas e explicadas no próprio estudo. O conteúdo da aula foi redigido originalmente.',NULL,4 FROM genesis1_seed;
