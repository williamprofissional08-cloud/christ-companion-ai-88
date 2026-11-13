import type { DevotionalContent } from "@/lib/types";

/**
 * Biblioteca offline: 66 livros bíblicos x 16 enfoques pastorais = 1.056
 * combinações diárias determinísticas. As referências apontam para leitura
 * bíblica; o texto do campo verse é uma síntese autoral, nunca uma citação.
 */
const BOOKS = [
  ["Gênesis", "1–3", "A criação, a dignidade humana, a queda e o início da promessa de Deus"],
  ["Êxodo", "3; 12–14; 19–20", "A libertação, a aliança e a presença de Deus no caminho"],
  ["Levítico", "19; 16", "A santidade de Deus e uma vida de adoração que alcança o cotidiano"],
  ["Números", "6; 13–14", "A fidelidade de Deus durante a caminhada e os desafios da confiança"],
  ["Deuteronômio", "6; 8; 30", "A memória da aliança e o chamado a amar a Deus de todo o coração"],
  ["Josué", "1; 3–4; 24", "A coragem para obedecer e a fidelidade de Deus às suas promessas"],
  ["Juízes", "2; 6–7", "A fragilidade humana e a misericórdia de Deus que chama ao retorno"],
  ["Rute", "1–4", "A lealdade, a providência e a esperança em meio às perdas"],
  ["1 Samuel", "3; 16–17", "Ouvir a voz de Deus e aprender a confiar nele acima das aparências"],
  ["2 Samuel", "7; 9; 12", "A promessa, a misericórdia e a responsabilidade diante de Deus"],
  ["1 Reis", "3; 8; 18–19", "A sabedoria, a fidelidade e a necessidade de voltar o coração ao Senhor"],
  ["2 Reis", "5; 6; 22", "A palavra de Deus, o arrependimento e a confiança em tempos difíceis"],
  ["1 Crônicas", "16; 17; 29", "A adoração, a memória da aliança e a generosidade"],
  ["2 Crônicas", "7; 20; 34", "A busca de Deus, a oração comunitária e a renovação espiritual"],
  ["Esdras", "3; 7; 9–10", "A restauração, o ensino das Escrituras e o recomeço responsável"],
  ["Neemias", "1–2; 4; 8", "A oração que conduz à ação e a reconstrução com perseverança"],
  ["Ester", "4; 7–8", "A coragem e a responsabilidade em circunstâncias decisivas"],
  ["Jó", "1–2; 19; 38–42", "A fé em meio ao sofrimento e a humildade diante da sabedoria divina"],
  ["Salmos", "23; 27; 46; 51; 121", "A oração sincera, a confiança e a adoração em todas as estações"],
  ["Provérbios", "3; 4; 15; 16", "A sabedoria prática que orienta palavras, escolhas e relacionamentos"],
  ["Eclesiastes", "3; 5; 12", "Os limites humanos e o sentido de viver diante de Deus"],
  ["Cânticos", "2; 4; 8", "O amor fiel, a beleza do compromisso e o cuidado nos relacionamentos"],
  ["Isaías", "6; 40; 53; 55", "A santidade, a consolação e a esperança na salvação de Deus"],
  ["Jeremias", "17; 29; 31", "A esperança, o coração transformado e a fidelidade de Deus"],
  ["Lamentações", "3", "A dor apresentada com honestidade e a renovação da misericórdia divina"],
  ["Ezequiel", "18; 34; 36–37", "A responsabilidade, o cuidado do Pastor e a promessa de renovação"],
  ["Daniel", "1; 3; 6", "A fidelidade a Deus em ambientes de pressão e incerteza"],
  ["Oseias", "2; 6; 11; 14", "O amor persistente de Deus e o chamado ao arrependimento"],
  ["Joel", "2", "O retorno sincero a Deus e a esperança da restauração"],
  ["Amós", "5", "A justiça que deve acompanhar a adoração"],
  ["Obadias", "1", "A humildade diante de Deus e o cuidado para não alimentar orgulho"],
  ["Jonas", "1–4", "A compaixão de Deus e o confronto com nossos preconceitos"],
  ["Miqueias", "6–7", "Praticar a justiça, amar a misericórdia e andar humildemente com Deus"],
  ["Naum", "1", "A justiça divina e o consolo para quem sofre opressão"],
  ["Habacuque", "1–3", "Levar perguntas honestas a Deus e aprender a viver pela fé"],
  ["Sofonias", "3", "O juízo, a purificação e a alegria de Deus em restaurar seu povo"],
  ["Ageu", "1–2", "Reordenar prioridades e perseverar na obra confiada por Deus"],
  ["Zacarias", "4; 9; 12–14", "A esperança messiânica e a obra realizada pelo Espírito de Deus"],
  ["Malaquias", "1; 3–4", "A integridade na adoração e a expectativa pela ação de Deus"],
  ["Mateus", "5–7; 11; 28", "O ensino e a autoridade de Jesus, o Messias e Rei"],
  ["Marcos", "1; 4; 8–10", "Jesus, o Servo poderoso, e o chamado para segui-lo"],
  ["Lucas", "4; 10; 15; 24", "A compaixão de Jesus e a boa notícia para os necessitados"],
  ["João", "1; 3; 10; 15; 20", "A identidade de Jesus, a vida nele e o chamado a permanecer em seu amor"],
  ["Atos", "2; 4; 9; 15", "A ação do Espírito Santo e o testemunho de Cristo pela igreja"],
  ["Romanos", "5; 8; 12", "A graça de Deus, a nova vida em Cristo e a transformação da mente"],
  ["1 Coríntios", "1; 11; 13; 15", "A unidade da igreja, o amor e a esperança da ressurreição"],
  ["2 Coríntios", "4; 5; 12", "A suficiência da graça e a força de Deus em nossa fraqueza"],
  ["Gálatas", "2; 5; 6", "A liberdade em Cristo e a vida conduzida pelo Espírito"],
  ["Efésios", "1–2; 4; 6", "A nova identidade em Cristo e a unidade vivida em amor"],
  ["Filipenses", "2–4", "A alegria em Cristo, a humildade e a perseverança"],
  ["Colossenses", "1; 2; 3", "A supremacia de Cristo e a nova maneira de viver nele"],
  ["1 Tessalonicenses", "4–5", "A esperança da vinda de Cristo e uma vida vigilante"],
  ["2 Tessalonicenses", "1–3", "A perseverança, o discernimento e a responsabilidade"],
  ["1 Timóteo", "4; 6", "A piedade, o exemplo e o cuidado com o ensino"],
  ["2 Timóteo", "1; 2; 3–4", "A coragem, a fidelidade às Escrituras e a perseverança"],
  ["Tito", "2–3", "A graça que salva e ensina uma vida dedicada ao bem"],
  ["Filemom", "1", "O perdão e a reconciliação que transformam relacionamentos"],
  ["Hebreus", "4; 11; 12", "A confiança em Cristo e a perseverança na fé"],
  ["Tiago", "1–2; 3; 5", "Uma fé coerente que se expressa em atitudes"],
  ["1 Pedro", "1–2; 5", "A esperança, a santidade e a firmeza em meio às provações"],
  ["2 Pedro", "1; 3", "O crescimento no conhecimento de Cristo e a vigilância"],
  ["1 João", "1; 3–4", "A certeza da vida em Cristo e o amor colocado em prática"],
  ["2 João", "1", "Permanecer na verdade e caminhar em amor"],
  ["3 João", "1", "A hospitalidade e a cooperação com a verdade"],
  ["Judas", "1", "A perseverança na fé e o discernimento"],
  ["Apocalipse", "1; 4–5; 21–22", "A soberania de Cristo e a esperança da nova criação"],
] as const;

const THEMES = [
  { title: "Confiança em Deus", focus: "A confiança bíblica não nega a realidade; ela leva a realidade à presença de Deus.", action: "Nomeie diante de Deus uma preocupação concreta e escolha uma atitude fiel que esteja ao seu alcance hoje.", prayer: "Senhor, ensina-me a confiar em tua fidelidade sem negar minhas dificuldades. Guia minhas decisões pela tua Palavra. Em nome de Jesus, amém.", question: "O que preciso entregar a Deus e qual passo de obediência posso dar hoje?" },
  { title: "Sabedoria para decidir", focus: "A sabedoria das Escrituras começa com reverência a Deus e aparece em escolhas coerentes com sua vontade.", action: "Antes de uma decisão importante, ore, examine os princípios bíblicos envolvidos e considere as consequências para outras pessoas.", prayer: "Deus, dá-me humildade para reconhecer meus limites e sabedoria para escolher o que é justo e agradável a ti. Amém.", question: "Minha escolha expressa amor a Deus e ao próximo?" },
  { title: "Perseverança na caminhada", focus: "A perseverança bíblica não é autossuficiência; é continuar fiel, dependendo da graça de Deus.", action: "Retome hoje uma prática de fé que você abandonou: leitura, oração, reconciliação ou serviço.", prayer: "Pai, sustenta-me para continuar fazendo o bem. Quando eu estiver cansado, lembra-me de tua graça e ensina-me a permanecer em Cristo. Amém.", question: "Em que área preciso perseverar sem confiar apenas nas minhas forças?" },
  { title: "Amor ao próximo", focus: "O amor ensinado por Deus torna-se visível em atitudes concretas de cuidado, verdade e serviço.", action: "Faça algo concreto por alguém hoje, sem buscar reconhecimento, respeitando a dignidade dessa pessoa.", prayer: "Senhor, livra-me de um amor apenas de palavras. Ensina-me a servir com sinceridade e a tratar as pessoas com a graça que recebo de ti. Amém.", question: "Quem precisa experimentar hoje um gesto concreto de amor por meio de mim?" },
  { title: "Arrependimento e recomeço", focus: "O arrependimento bíblico envolve reconhecer o pecado, voltar-se para Deus e produzir frutos coerentes com essa mudança.", action: "Confesse a Deus com sinceridade aquilo que precisa ser abandonado e, quando necessário, procure reparar o dano causado.", prayer: "Deus misericordioso, mostra-me onde preciso mudar. Dá-me um coração ensinável e coragem para corrigir meus caminhos. Em nome de Jesus, amém.", question: "Que mudança concreta demonstrará que estou levando a sério o que a Palavra ensina?" },
  { title: "Gratidão", focus: "A gratidão bíblica reconhece a bondade de Deus sem fingir que não existem dores ou dificuldades.", action: "Registre três motivos reais de gratidão e agradeça também por alguém que foi instrumento de cuidado em sua vida.", prayer: "Pai, abre meus olhos para reconhecer teus cuidados. Que a gratidão não me torne indiferente à dor alheia, mas mais generoso e fiel. Amém.", question: "Que cuidado de Deus tenho deixado passar despercebido?" },
  { title: "Humildade", focus: "A humildade bíblica não é desprezar a própria dignidade, mas reconhecer que dependemos de Deus e devemos servir ao próximo.", action: "Ouça alguém com atenção, admita um erro se necessário e escolha servir sem exigir destaque.", prayer: "Senhor Jesus, forma em mim um coração humilde. Que minhas atitudes não sejam guiadas pelo orgulho, mas pelo amor e pela verdade. Amém.", question: "Onde o orgulho tem dificultado minha obediência ou meus relacionamentos?" },
  { title: "Esperança", focus: "A esperança cristã está fundamentada no caráter de Deus e nas promessas reveladas nas Escrituras, não em previsões fáceis.", action: "Leia a passagem indicada e escreva qual verdade sobre Deus sustenta sua esperança neste momento.", prayer: "Deus de esperança, firma meu coração em tuas promessas. Ajuda-me a agir com fidelidade enquanto aguardo tua direção. Amém.", question: "Em qual verdade bíblica posso firmar minha esperança hoje?" },
  { title: "Integridade", focus: "A integridade bíblica une o que confessamos crer ao modo como agimos em público e em particular.", action: "Revise uma atitude no trabalho, em casa ou na internet e corrija o que não combina com a verdade.", prayer: "Pai, que minhas palavras e ações sejam coerentes diante de ti. Dá-me coragem para fazer o que é correto mesmo quando ninguém está vendo. Amém.", question: "Existe alguma área em que minhas atitudes contradizem minha fé?" },
  { title: "Oração sincera", focus: "A oração bíblica permite apresentar a Deus louvor, pedidos, lamento, confissão e gratidão com sinceridade.", action: "Separe alguns minutos para orar com suas próprias palavras, incluindo adoração, confissão, pedidos e gratidão.", prayer: "Senhor, ensina-me a falar contigo com sinceridade e a ouvir tua Palavra com atenção. Que minha oração conduza a uma vida obediente. Amém.", question: "O que tenho evitado apresentar a Deus em oração?" },
  { title: "Família e relacionamentos", focus: "A fé se expressa também na maneira como tratamos quem convive conosco, com verdade, paciência e responsabilidade.", action: "Tome a iniciativa de uma conversa respeitosa, um pedido de perdão ou um gesto de cuidado dentro de casa.", prayer: "Deus, dá-me sabedoria para amar minha família com atitudes, palavras cuidadosas e responsabilidade. Ajuda-nos a buscar a paz sem esconder a verdade. Amém.", question: "Que atitude minha pode contribuir para um relacionamento mais saudável?" },
  { title: "Coragem", focus: "A coragem bíblica nasce da confiança em Deus e se manifesta em obediência, não em impulsividade.", action: "Identifique uma atitude correta que você tem adiado por medo e dê um passo prudente em direção a ela.", prayer: "Senhor, dá-me coragem para obedecer à tua Palavra e discernimento para não confundir fé com imprudência. Amém.", question: "Que passo de fidelidade tenho adiado por medo?" },
  { title: "Serviço", focus: "Na perspectiva de Jesus, grandeza está ligada ao serviço e ao cuidado, não à busca por posição.", action: "Ajude alguém de maneira prática e discreta, sem transformar o gesto em moeda de troca.", prayer: "Jesus, ensina-me a servir como alguém que recebeu tua graça. Livra-me da vaidade e torna minhas mãos disponíveis ao bem. Amém.", question: "Como posso servir alguém de modo concreto hoje?" },
  { title: "Discernimento", focus: "Discernir exige examinar ideias e atitudes à luz das Escrituras, considerando o contexto e buscando sabedoria.", action: "Não compartilhe imediatamente uma informação ou opinião. Verifique, compare com princípios bíblicos e considere se edifica.", prayer: "Deus, dá-me discernimento para reconhecer a verdade, rejeitar o engano e agir com amor. Amém.", question: "Tenho avaliado minhas convicções à luz da Palavra ou apenas repetido opiniões?" },
  { title: "Contentamento", focus: "O contentamento cristão não elimina o trabalho por melhorias justas; ele impede que a comparação governe o coração.", action: "Agradeça pelo que recebeu, identifique uma comparação prejudicial e pratique generosidade com o que tem.", prayer: "Pai, ensina-me a viver com contentamento, sem inveja e sem acomodação diante do que precisa ser transformado. Amém.", question: "Que comparação tem roubado minha gratidão ou minha paz?" },
  { title: "Fidelidade a Cristo", focus: "Seguir Jesus envolve ouvir seus ensinamentos, confiar nele e praticar aquilo que ele ordena.", action: "Escolha um ensinamento de Jesus relacionado à leitura e transforme-o em uma atitude observável hoje.", prayer: "Senhor Jesus, ajuda-me não apenas a ouvir tuas palavras, mas a colocá-las em prática. Que minha vida demonstre fidelidade a ti. Amém.", question: "Qual ensinamento de Cristo preciso praticar de maneira mais concreta?" },
] as const;

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function devotionalLibrarySize(): number {
  return BOOKS.length * THEMES.length;
}

export function fallbackDevotional(day: string, selection = 0): DevotionalContent {
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  const rotationBase = Number.isFinite(dayNumber) ? dayNumber : hash(day);
  const size = devotionalLibrarySize();
  const index = ((rotationBase + selection) % size + size) % size;
  const book = BOOKS[Math.floor(index / THEMES.length)]!;
  const theme = THEMES[index % THEMES.length]!;
  const reference = book[1]
    .split(";")
    .map((passage) => book[0] + " " + passage.trim())
    .join("; ");
  const bookContext = book[2];

  return {
    theme: theme.title + " — " + book[0],
    verse: {
      reference,
      text: bookContext,
      kind: "synthesis",
    },
    reflection:
      "A leitura de " + reference + " apresenta " + bookContext.toLowerCase() + ". Esse contexto nos ajuda a não tratar a passagem como uma frase isolada: primeiro precisamos observar o que o texto comunicou aos seus primeiros leitores e como se encaixa no testemunho das Escrituras.\n\n" +
      theme.focus + "\n\n" +
      "Ao ler, observe o que a passagem revela sobre Deus, sobre a condição humana e sobre a resposta de fé esperada. A aplicação cristã deve permanecer ligada ao sentido do texto e encontrar seu centro na revelação de Deus, plenamente anunciada em Jesus Cristo.",
    application: theme.action + " Volte ao texto de " + reference + " e confira se sua aplicação respeita o contexto.",
    prayer: theme.prayer,
    challenge: "Leia " + reference + " com atenção, anote uma verdade sobre Deus e pratique hoje uma atitude coerente com ela.",
    question: theme.question,
    motivational: "A Palavra de Deus nos chama a uma fé que compreende, confia e se expressa em obediência.",
    readingSuggestion: reference + " — leia o capítulo ou os capítulos indicados por inteiro, observando o contexto anterior e posterior.",
  };
}
