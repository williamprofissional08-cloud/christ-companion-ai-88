import type { StudyContent } from "../types";

/**
 * Estudos revisados manualmente. Têm prioridade sobre o conteúdo gerado por IA,
 * para servir de padrão de referência antes da expansão do curso completo.
 * Rótulos: [TEXTO BÍBLICO] [CONTEXTO] [INFERÊNCIA] [INTERPRETAÇÃO] [ESPECULAÇÃO].
 */
const genesis1: StudyContent = {
  version: 2,
  depth: "deep",
  intro: "",
  historicalContext: "",
  keyPoints: [],
  application: "",
  crossReferences: [],
  questions: [],
  conclusion: "",
  prayer: "",
  sections: [
    {
      id: "intro",
      title: "1. Introdução e objetivo",
      kind: "introduction",
      confidence: "high",
      body: `Gênesis 1:1–31 abre a Bíblia apresentando Deus como Criador de tudo o que existe. O objetivo deste estudo é ler o capítulo com atenção, entender o que o próprio texto afirma, situá-lo no livro e no restante das Escrituras, e separar com honestidade o que é **texto**, o que é **contexto**, o que é **inferência** e o que é **interpretação**.

Observação: o relato da criação continua até Gênesis 2:3 (o sétimo dia). Aqui estudamos 1:1–31, mas a leitura completa exige incluir 2:1–3.`,
    },
    {
      id: "texto",
      title: "2. O texto: estrutura observável",
      kind: "scripture",
      confidence: "high",
      scriptureRefs: ["Gênesis 1:1-31", "Gênesis 2:1-3"],
      body: `**[TEXTO BÍBLICO]** Leia o capítulo inteiro antes de prosseguir. Elementos que se repetem e podem ser observados diretamente:

- "E disse Deus" — a criação ocorre pela palavra de Deus (Gênesis 1:3, 6, 9, 11, 14, 20, 24, 26).
- "E assim foi" — o que Deus diz acontece (Gênesis 1:7, 9, 11, 15, 24, 30).
- "E viu Deus que era bom" — avaliação divina (Gênesis 1:4, 10, 12, 18, 21, 25); ao final, "muito bom" (Gênesis 1:31).
- "E foi a tarde e a manhã" — marcação de cada dia (Gênesis 1:5, 8, 13, 19, 23, 31).

**Estrutura dos dias (observação do texto):**
- Dia 1 — luz e trevas separadas (1:3-5) ↔ Dia 4 — luminares que governam dia e noite (1:14-19)
- Dia 2 — águas de cima e de baixo separadas (1:6-8) ↔ Dia 5 — aves e seres das águas (1:20-23)
- Dia 3 — terra seca e vegetação (1:9-13) ↔ Dia 6 — animais terrestres e o ser humano (1:24-31)

**[INFERÊNCIA]** O versículo 2 descreve a terra "sem forma e vazia". Os dias 1–3 parecem dar *forma* (separações) e os dias 4–6 *preenchem* esses espaços. Essa correspondência é amplamente reconhecida pelos estudiosos e se apoia no próprio texto, mas é uma leitura da estrutura, não uma afirmação explícita do capítulo.`,
    },
    {
      id: "contexto-livro",
      title: "3. Contexto no livro e na Bíblia",
      kind: "context",
      confidence: "probable",
      body: `**[TEXTO BÍBLICO]** Gênesis 1 é seguido por um segundo relato com outro foco (Gênesis 2:4-25), centrado no ser humano no jardim. Os dois não precisam ser lidos como contraditórios: o primeiro é panorâmico, o segundo é detalhado.

**[CONTEXTO]** A tradição judaica e cristã associa o Pentateuco a Moisés (ver Lucas 24:44; João 5:46). Datas e processos de composição são debatidos entre estudiosos; não é possível afirmar com segurança detalhes além disso.

**[CONTEXTO]** Os primeiros leitores viviam cercados por povos com relatos de origem politeístas (Mesopotâmia, Egito). Comparações acadêmicas mostram semelhanças de tema e diferenças profundas.

**[INTERPRETAÇÃO]** Diante desse ambiente, Gênesis 1 funciona também como afirmação polêmica: há um só Deus; sol, lua e mar não são divindades, mas criaturas. Note que o texto nem sequer nomeia "sol" e "lua", chamando-os de "luzeiro maior" e "luzeiro menor" (Gênesis 1:16). Muitos intérpretes veem nisso uma intenção de desmistificar os astros — leitura provável, mas inferida.`,
    },
    {
      id: "versiculos",
      title: "4. Explicação versículo por versículo",
      kind: "analysis",
      confidence: "high",
      body: `**1:1** — **[TEXTO BÍBLICO]** "No princípio criou Deus os céus e a terra." "Céus e terra" é uma expressão que indica a totalidade do que existe. O verbo hebraico *bara* ("criar"), no Antigo Testamento, tem sempre Deus como sujeito (ex.: Isaías 40:26; 45:7).
**[INTERPRETAÇÃO]** Se o v. 1 é uma afirmação-título que resume o capítulo ou o primeiro ato da criação é debatido entre tradutores.

**1:2** — **[TEXTO BÍBLICO]** A terra estava "sem forma e vazia" (*tohu wabohu*), havia trevas sobre o abismo e o Espírito de Deus "pairava" sobre as águas.
**[INTERPRETAÇÃO]** "Espírito de Deus" (*ruach Elohim*) também pode ser traduzido "vento de Deus"; a maioria das tradições cristãs lê como o Espírito, à luz do restante das Escrituras. A chamada "teoria do intervalo" (uma criação anterior destruída entre os v. 1 e 2) é **[ESPECULAÇÃO]**: o texto não a afirma.

**1:3-5** — Luz pela palavra; separação luz/trevas; Deus dá nomes. Nomear indica autoridade.
**[INFERÊNCIA]** A luz existe antes dos luzeiros do dia 4: o texto mostra que a luz depende de Deus, não do sol.

**1:6-8** — O "firmamento" (*raqia*, algo estendido) separa águas de cima e de baixo. O texto descreve o mundo como visto pelo observador; não pretende ser um tratado de física.

**1:9-13** — Terra seca e mares; vegetação "segundo a sua espécie". A expressão destaca ordem e reprodução estável, sem definir categorias da biologia moderna.

**1:14-19** — Luzeiros para separar dia e noite, marcar "sinais, estações, dias e anos" e iluminar. "Estações" (*mo'adim*) pode incluir tempos fixos/festas. Os astros servem; não governam o destino humano (compare Deuteronômio 4:19; Isaías 47:13-14).

**1:20-23** — Seres das águas e aves; aparece a primeira **bênção**: "frutificai e multiplicai-vos". Os "grandes monstros marinhos" (*tanninim*), temidos em mitos vizinhos, são aqui simples criaturas de Deus.

**1:24-25** — Animais terrestres "segundo a sua espécie".

**1:26-28** — **[TEXTO BÍBLICO]** "Façamos o homem à nossa imagem, conforme a nossa semelhança." Homem e mulher são criados à imagem de Deus, abençoados e chamados a frutificar, encher a terra, sujeitá-la e dominar sobre os animais.
**[INTERPRETAÇÃO]** O plural "façamos" recebe várias leituras: plural de majestade, deliberação com a corte celestial, ou alusão à pluralidade em Deus. Muitos cristãos veem aqui uma antecipação compatível com a Trindade revelada no Novo Testamento, mas o texto sozinho não a define.
**[INTERPRETAÇÃO]** Sobre a "imagem de Deus" há leituras complementares: representação/função (governar como representante de Deus), relação (com Deus e com o próximo) e capacidades (razão, moral). O contexto imediato liga a imagem ao domínio (1:26) — por isso a leitura funcional/representativa é considerada provável, sem excluir as demais.
**[INFERÊNCIA]** "Dominar" no contexto de um mundo "bom" e de um Deus que cuida não autoriza exploração destrutiva; compare Gênesis 2:15 ("cultivar e guardar").

**1:29-30** — Deus dá plantas como alimento ao ser humano e aos animais. Comparado com Gênesis 9:3, há uma mudança posterior.

**1:31** — Deus vê "tudo" e é "muito bom". Somente aqui aparece o artigo em "o sexto dia" no hebraico, destacando o clímax.`,
    },
    {
      id: "dias",
      title: "5. A questão dos \"dias\" (interpretações)",
      kind: "theology",
      confidence: "debated",
      body: `**[TEXTO BÍBLICO]** O texto usa *yom* ("dia") com "tarde e manhã" e números ordinais.

Cristãos fiéis às Escrituras sustentam leituras diferentes:
- **Dias literais de 24 horas** — leitura mais direta das expressões "tarde e manhã" (compare Êxodo 20:11).
- **Dia-era** — cada dia representa um longo período (argumenta-se com usos amplos de *yom*, como Gênesis 2:4).
- **Estrutura literária (framework)** — os dias são um quadro teológico ordenado, não uma cronologia.
- **Dias analógicos** — os "dias de trabalho" de Deus são análogos à semana humana.

**O que é seguro:** Deus criou tudo, com ordem, pela sua palavra, e o mundo foi declarado bom.
**O que permanece debatido:** a duração e a natureza cronológica dos dias. Este estudo não apresenta nenhuma dessas posições como unanimidade.`,
    },
    {
      id: "teologia",
      title: "6. Verdades teológicas do capítulo",
      kind: "theology",
      confidence: "high",
      body: `- **Deus é anterior e distinto da criação** (Gênesis 1:1; Salmos 90:2).
- **Deus cria pela palavra** (Gênesis 1:3; Salmos 33:6, 9; Hebreus 11:3).
- **A criação é boa** — o mundo material não é mau em si (Gênesis 1:31; 1 Timóteo 4:4).
- **Deus ordena o caos** — separa, nomeia e preenche (Gênesis 1:2-25).
- **Dignidade humana** — todo ser humano, homem e mulher, é imagem de Deus (Gênesis 1:27; 9:6; Tiago 3:9).
- **Vocação humana** — frutificar e cuidar da criação como representantes de Deus (Gênesis 1:28; Salmos 8:5-8).`,
    },
    {
      id: "referencias",
      title: "7. Referências cruzadas (com relação real)",
      kind: "cross-references",
      confidence: "high",
      body: `- **João 1:1-3** — "No princípio era o Verbo... todas as coisas foram feitas por intermédio dele": João retoma deliberadamente Gênesis 1:1 e identifica a Palavra criadora com Cristo.
- **Colossenses 1:15-17** — Cristo é a imagem do Deus invisível e por meio dele tudo foi criado.
- **Hebreus 11:3** — o universo foi formado pela palavra de Deus; compreendido pela fé.
- **Salmos 33:6-9** — "Pela palavra do Senhor foram feitos os céus."
- **Salmos 104** — poema que celebra a mesma ordem criada.
- **Salmos 8:3-8** — o ser humano coroado de glória e com domínio sobre as obras de Deus.
- **Êxodo 20:11** — a semana de trabalho de Israel fundamentada nos dias da criação.
- **2 Coríntios 4:6** — o Deus que disse "haja luz" ilumina o coração com o conhecimento de Cristo.
- **Romanos 1:20** — os atributos invisíveis de Deus são percebidos pelas coisas criadas.
- **Apocalipse 21:1-5; 22:5** — nova criação, sem trevas: a Bíblia começa e termina com Deus criando.`,
    },
    {
      id: "cristo",
      title: "8. Cristo na passagem (conexão legítima)",
      kind: "theology",
      confidence: "high",
      body: `A conexão não é alegórica: é o próprio Novo Testamento que a faz. **[TEXTO BÍBLICO]** Cristo é o Verbo por quem tudo foi feito (João 1:3), a imagem de Deus (Colossenses 1:15) e aquele em quem há nova criação (2 Coríntios 5:17).

**[INTERPRETAÇÃO]** O ser humano, criado à imagem de Deus, encontra em Cristo a imagem perfeita, à qual os crentes são conformados (Romanos 8:29; Colossenses 3:10).

Evite conexões artificiais, como ver cada dia como símbolo de uma era da igreja ou associar detalhes (ex.: a luz do dia 1) a eventos específicos da vida de Jesus sem apoio textual.`,
    },
    {
      id: "erros",
      title: "9. Erros a evitar",
      kind: "reasoning",
      confidence: "high",
      body: `- Transformar Gênesis 1 em manual de ciência moderna — ou, ao contrário, tratá-lo como mito sem verdade histórica e teológica.
- Apresentar uma posição sobre os "dias" como a única fiel.
- Falácia da palavra-raiz: tirar conclusões amplas apenas da etimologia de *bara*, *raqia* ou *tohu*.
- Usar "dominar" para justificar destruição da criação.
- Ler a Trindade como se estivesse plenamente explicada em 1:26, ignorando a revelação progressiva.
- Afirmar a "teoria do intervalo" como ensino do texto.`,
    },
    {
      id: "aplicacao",
      title: "10. Aplicação fundamentada no texto",
      kind: "application",
      confidence: "probable",
      body: `- **Adoração:** se Deus criou tudo, só ele merece adoração — não astros, recursos ou pessoas (Romanos 1:25).
- **Confiança:** o Deus que ordena o caos pela palavra é digno de confiança na sua desordem pessoal (inferência pastoral, não promessa específica do texto).
- **Dignidade:** trate todo ser humano como portador da imagem de Deus, independentemente de condição (Gênesis 1:27; Tiago 3:9).
- **Mordomia:** cuide do que Deus confiou — corpo, trabalho, natureza (Gênesis 1:28; 2:15).
- **Gratidão:** receba as coisas criadas como boas, com ação de graças (1 Timóteo 4:4).`,
    },
    {
      id: "perguntas",
      title: "11. Perguntas para reflexão",
      kind: "reflection",
      body: `1. Quais frases se repetem em Gênesis 1, e o que elas ensinam sobre Deus?
2. Como a correspondência entre os dias 1–3 e 4–6 ajuda a entender o v. 2?
3. Que diferença prática faz crer que todo ser humano é imagem de Deus (Gênesis 1:27)?
4. Como João 1:1-3 muda a sua leitura de Gênesis 1:1?
5. Em que área da sua vida você precisa da ordem que só a palavra de Deus traz?`,
    },
    {
      id: "fontes",
      title: "12. Como chegamos a essas conclusões?",
      kind: "sources",
      collapsible: true,
      body: `- Base primária: o texto bíblico de Gênesis 1:1–2:3 e as passagens citadas.
- Termos hebraicos (*bara*, *tohu wabohu*, *ruach*, *raqia*, *yom*, *tanninim*, *tselem*) conforme o uso no Antigo Testamento e léxicos de referência como Brown-Driver-Briggs e HALOT (consultados de forma geral; nenhuma citação literal ou página é atribuída aqui).
- As posições sobre os "dias" e a "imagem de Deus" são apresentadas como existem no debate cristão, sem atribuir consenso.
- Níveis de confiança: 🟢 alta (texto explícito) · 🟡 provável · 🟠 debatido · 🔴 incerto.`,
    },
    {
      id: "oracao",
      title: "13. Oração final",
      kind: "summary",
      body: `Senhor, Criador dos céus e da terra, eu te adoro porque tudo veio da tua palavra (Salmos 33:6). Obrigado por me criar à tua imagem (Gênesis 1:27). Traz ordem ao que em mim está sem forma e vazio, e faze-me cuidar do que confiaste a mim. Em Cristo, por quem todas as coisas foram feitas (João 1:3), amém.`,
    },
  ],
};

export const CURATED_STUDIES: Record<string, StudyContent> = {
  "genesis-1-criacao": genesis1,
};
