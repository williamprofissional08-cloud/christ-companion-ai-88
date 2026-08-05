export type TrackStepKind = "leitura" | "checkpoint" | "revisao";

export type TrackStep = {
  index: number;
  kind: TrackStepKind;
  title: string;
  focus: string;
  reading: string;
};

export type ReadingTrack = {
  slug: string;
  title: string;
  theme: string;
  summary: string;
  keyVerse: string;
  readings: { title: string; focus: string; reading: string }[];
};

/** Monta as etapas da trilha: leituras + checkpoint a cada 3 leituras + revisão final. */
export function buildSteps(track: ReadingTrack): TrackStep[] {
  const steps: TrackStep[] = [];
  let index = 1;
  track.readings.forEach((reading, i) => {
    steps.push({ index: index++, kind: "leitura", ...reading });
    const isLast = i === track.readings.length - 1;
    if ((i + 1) % 3 === 0 && !isLast) {
      steps.push({
        index: index++,
        kind: "checkpoint",
        title: `Checkpoint ${Math.floor((i + 1) / 3)}`,
        focus: `Consolidar o que Deus falou nas últimas leituras sobre ${track.theme.toLowerCase()}.`,
        reading: track.keyVerse,
      });
    }
  });
  steps.push({
    index: index++,
    kind: "revisao",
    title: "Revisão da trilha",
    focus: `Revisar toda a caminhada sobre ${track.theme.toLowerCase()} e firmar as promessas aprendidas.`,
    reading: track.keyVerse,
  });
  return steps;
}

function track(
  slug: string,
  title: string,
  theme: string,
  summary: string,
  keyVerse: string,
  readings: [string, string, string][],
): ReadingTrack {
  return {
    slug,
    title,
    theme,
    summary,
    keyVerse,
    readings: readings.map(([t, focus, reading]) => ({ title: t, focus, reading })),
  };
}

export const TRACK_THEMES = [
  "Ansiedade",
  "Fé",
  "Oração",
  "Perdão",
  "Identidade",
  "Propósito",
  "Gratidão",
  "Esperança",
] as const;

export const READING_TRACKS: ReadingTrack[] = [
  track(
    "vencendo-a-ansiedade",
    "Vencendo a ansiedade",
    "Ansiedade",
    "Uma trilha guiada para entregar preocupações a Deus e aprender a descansar no cuidado do Pai.",
    "Filipenses 4:6-7",
    [
      ["O convite para não temer", "Descobrir que Deus conhece o seu medo antes de você falar.", "Isaías 41:10-13"],
      ["Lançando sobre Ele", "Aprender o ato diário de entregar a ansiedade em oração.", "1 Pedro 5:6-7"],
      ["A paz que guarda o coração", "Trocar a preocupação por oração e gratidão.", "Filipenses 4:4-9"],
      ["O Pastor que supre", "Descansar na provisão e direção de Deus.", "Salmos 23"],
      ["Não vos inquieteis", "Ver como Jesus trata a ansiedade pelo amanhã.", "Mateus 6:25-34"],
      ["Descanso para a alma", "Aceitar o jugo suave de Cristo.", "Mateus 11:28-30"],
      ["Deus é o meu refúgio", "Firmar-se em Deus mesmo quando tudo tremer.", "Salmos 46"],
      ["Pensamentos renovados", "Encher a mente daquilo que é verdadeiro e puro.", "Romanos 12:1-2"],
      ["Firmeza para os próximos dias", "Assumir um estilo de vida de confiança.", "Salmos 91"],
    ],
  ),
  track(
    "fe-que-move",
    "Fé que move montanhas",
    "Fé",
    "Uma caminhada pelas Escrituras para fortalecer uma fé viva, obediente e perseverante.",
    "Hebreus 11:1",
    [
      ["O que é a fé", "Compreender a fé como certeza e convicção.", "Hebreus 11:1-6"],
      ["A fé de Abraão", "Aprender a obedecer antes de entender.", "Gênesis 12:1-9"],
      ["Fé em meio à tempestade", "Confiar quando o barco está balançando.", "Marcos 4:35-41"],
      ["Fé que persiste", "Insistir em Deus mesmo com demora.", "Lucas 18:1-8"],
      ["Fé e obras", "Provar a fé por atitudes concretas.", "Tiago 2:14-26"],
      ["Fé para o impossível", "Crer no Deus que ressuscita e restaura.", "Romanos 4:16-25"],
      ["A fé que vence o mundo", "Viver como quem já sabe o final da história.", "1 João 5:1-5"],
      ["Correndo com perseverança", "Tirar os pesos que atrasam a corrida.", "Hebreus 12:1-3"],
      ["Fé para o cotidiano", "Aplicar fé em decisões práticas desta semana.", "2 Coríntios 5:6-10"],
    ],
  ),
  track(
    "vida-de-oracao",
    "Uma vida de oração",
    "Oração",
    "Aprenda a orar com constância, intimidade e fé, seguindo o modelo de Jesus.",
    "Lucas 11:1",
    [
      ["Senhor, ensina-nos a orar", "Começar pelo desejo de aprender com Jesus.", "Lucas 11:1-13"],
      ["O Pai Nosso", "Entender cada pedido do modelo de oração.", "Mateus 6:5-15"],
      ["O lugar secreto", "Cultivar a oração escondida e sincera.", "Mateus 6:6"],
      ["Orando as Escrituras", "Usar os Salmos como linguagem de oração.", "Salmos 63"],
      ["Intercessão", "Orar pelos outros como Moisés e Paulo.", "Êxodo 32:11-14"],
      ["Oração com jejum", "Buscar Deus com dependência total.", "Isaías 58:6-11"],
      ["Orando sem cessar", "Transformar o dia inteiro em conversa com Deus.", "1 Tessalonicenses 5:16-18"],
      ["Quando a resposta demora", "Perseverar e confiar no tempo de Deus.", "Habacuque 2:1-4"],
      ["Oração e gratidão", "Fechar cada oração reconhecendo o que Deus fez.", "Colossenses 4:2-6"],
    ],
  ),
  track(
    "caminho-do-perdao",
    "O caminho do perdão",
    "Perdão",
    "Uma trilha para receber o perdão de Deus e perdoar de coração quem lhe feriu.",
    "Efésios 4:32",
    [
      ["Perdoados por graça", "Contemplar o perdão que recebemos em Cristo.", "Efésios 1:3-10"],
      ["Confissão que liberta", "Trazer à luz o que pesa no coração.", "Salmos 32"],
      ["A dívida perdoada", "Ver o perigo de não perdoar.", "Mateus 18:21-35"],
      ["Perdoar setenta vezes sete", "Escolher perdoar como decisão e processo.", "Lucas 17:1-6"],
      ["Curando a raiz da amargura", "Arrancar rancor antes que cresça.", "Hebreus 12:14-17"],
      ["José e seus irmãos", "Ver Deus transformar dor em propósito.", "Gênesis 50:15-21"],
      ["Amando os inimigos", "Orar por quem lhe machucou.", "Mateus 5:38-48"],
      ["Reconciliação possível", "Buscar paz onde for possível.", "Romanos 12:14-21"],
      ["Vivendo em liberdade", "Assumir uma vida sem dívidas emocionais.", "Colossenses 3:12-17"],
    ],
  ),
  track(
    "quem-eu-sou-em-cristo",
    "Quem eu sou em Cristo",
    "Identidade",
    "Reconstrua sua identidade sobre aquilo que Deus diz sobre você nas Escrituras.",
    "1 João 3:1",
    [
      ["Criado com propósito", "Ver o valor que Deus deu à sua vida.", "Salmos 139:13-18"],
      ["Filho amado", "Receber a adoção como filho de Deus.", "Romanos 8:14-17"],
      ["Nova criatura", "Deixar a antiga identidade para trás.", "2 Coríntios 5:17-21"],
      ["Escolhido e chamado", "Entender o chamado que você recebeu.", "1 Pedro 2:9-10"],
      ["Livre da condenação", "Silenciar a voz da culpa.", "Romanos 8:1-11"],
      ["Corpo de Cristo", "Descobrir seu lugar na comunidade.", "1 Coríntios 12:12-27"],
      ["Fortalecido no interior", "Ser firmado no amor de Cristo.", "Efésios 3:14-21"],
      ["Herdeiro das promessas", "Viver da herança e não da carência.", "Gálatas 4:1-7"],
      ["Andando como filho", "Traduzir identidade em escolhas diárias.", "Efésios 5:1-10"],
    ],
  ),
  track(
    "descobrindo-o-proposito",
    "Descobrindo o propósito",
    "Propósito",
    "Uma trilha para discernir a vontade de Deus e servir com os dons recebidos.",
    "Efésios 2:10",
    [
      ["Preparados para boas obras", "Entender que há obras preparadas para você.", "Efésios 2:1-10"],
      ["O chamado de Moisés", "Superar a sensação de insuficiência.", "Êxodo 3:1-15"],
      ["Discernindo a vontade de Deus", "Renovar a mente para reconhecer o que agrada a Deus.", "Romanos 12:1-8"],
      ["Dons para servir", "Identificar seus dons e usá-los.", "1 Pedro 4:7-11"],
      ["Fidelidade no pouco", "Cuidar bem daquilo que já está em sua mão.", "Lucas 16:10-13"],
      ["O propósito na dor", "Ver Deus trabalhar mesmo nos desertos.", "Romanos 8:28-39"],
      ["Servindo aos outros", "Encontrar propósito no serviço concreto.", "Mateus 25:31-40"],
      ["Correndo para o alvo", "Focar no que realmente importa.", "Filipenses 3:7-16"],
      ["Um plano para os próximos passos", "Definir compromissos práticos com Deus.", "Provérbios 16:1-9"],
    ],
  ),
  track(
    "coracao-grato",
    "Coração grato",
    "Gratidão",
    "Treine os olhos para reconhecer a bondade de Deus todos os dias.",
    "1 Tessalonicenses 5:18",
    [
      ["Bendize, ó minha alma", "Lembrar dos benefícios de Deus.", "Salmos 103:1-14"],
      ["Gratidão em tudo", "Agradecer também no que é difícil.", "1 Tessalonicenses 5:12-24"],
      ["O leproso que voltou", "Não esquecer de voltar para agradecer.", "Lucas 17:11-19"],
      ["Memorial das obras de Deus", "Registrar o que Deus já fez.", "Josué 4:1-9"],
      ["Contentamento", "Aprender a se alegrar no que se tem.", "Filipenses 4:10-13"],
      ["Louvor na prisão", "Adorar antes da resposta chegar.", "Atos 16:16-34"],
      ["Generosidade grata", "Deixar a gratidão gerar generosidade.", "2 Coríntios 9:6-15"],
      ["Entrando com ações de graças", "Fazer da gratidão a porta da oração.", "Salmos 100"],
      ["Uma vida de gratidão", "Firmar hábitos de gratidão diária.", "Colossenses 3:15-17"],
    ],
  ),
  track(
    "esperanca-que-nao-falha",
    "Esperança que não falha",
    "Esperança",
    "Para tempos de espera e cansaço: firmando o coração nas promessas de Deus.",
    "Romanos 15:13",
    [
      ["Renovando as forças", "Esperar em Deus e receber novo vigor.", "Isaías 40:27-31"],
      ["Misericórdias renovadas", "Encontrar esperança mesmo na perda.", "Lamentações 3:19-33"],
      ["Esperança viva", "Ancorar-se na ressurreição de Cristo.", "1 Pedro 1:3-9"],
      ["Por que estás abatida?", "Falar com a própria alma diante de Deus.", "Salmos 42"],
      ["Esperança que não decepciona", "Ver como a tribulação produz caráter.", "Romanos 5:1-11"],
      ["A âncora da alma", "Segurar firme a promessa de Deus.", "Hebreus 6:13-20"],
      ["Enxugará toda lágrima", "Olhar para o futuro prometido.", "Apocalipse 21:1-7"],
      ["Esperança em comunidade", "Encorajar e ser encorajado.", "Hebreus 10:19-25"],
      ["Vivendo de esperança", "Levar esperança a outras pessoas.", "1 Pedro 3:13-17"],
    ],
  ),
];

export function getTrack(slug: string) {
  return READING_TRACKS.find((t) => t.slug === slug);
}
