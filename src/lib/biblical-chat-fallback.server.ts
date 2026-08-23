type BiblicalTopic = {
  terms: string[];
  response: string;
};

const TOPICS: BiblicalTopic[] = [
  {
    terms: ["jesus", "cristo", "messias", "salvador"],
    response:
      "## Quem é Jesus segundo a Bíblia\n\nJesus Cristo é o Filho de Deus e o Salvador prometido. Ele é a Palavra que se fez carne e habitou entre nós (João 1:1,14). Viveu sem pecado, morreu por nossos pecados e ressuscitou, oferecendo reconciliação com Deus a todo aquele que crê (1 Coríntios 15:3-4; João 3:16).\n\nEle também é o único caminho ao Pai: “Eu sou o caminho, e a verdade, e a vida” (João 14:6). Seguir Jesus significa confiar nele, aprender seus ensinamentos e viver em amor e obediência (João 13:34-35).\n\n**Para refletir:** em qual área da sua vida você precisa confiar mais em Jesus hoje?",
  },
  {
    terms: ["ansiedade", "ansioso", "ansiosa", "preocupacao", "preocupado", "medo"],
    response:
      "## Quando a ansiedade chega\n\nA Bíblia nos convida a apresentar cada preocupação a Deus em oração, com gratidão. A promessa não é que todo problema desaparecerá imediatamente, mas que a paz de Deus guardará nosso coração e nossa mente em Cristo (Filipenses 4:6-7).\n\nVocê pode começar agora: diga a Deus, com palavras simples, o que está pesando em você e entregue a Ele uma preocupação de cada vez. Lembre-se também de que Deus cuida de você (1 Pedro 5:7). Se a ansiedade estiver intensa ou persistente, buscar ajuda profissional também é um gesto sábio de cuidado.\n\n**Oração:** Senhor, entrego a Ti minhas preocupações. Guarda meu coração com a Tua paz, conforme Filipenses 4:6-7. Amém.",
  },
  {
    terms: ["oracao", "orar", "ore", "oração"],
    response:
      "## Sobre a oração\n\nOrar é aproximar-se de Deus com sinceridade. Jesus ensinou a buscar o Pai, honrar seu nome, pedir o necessário, confessar pecados e perdoar (Mateus 6:9-13). Não é preciso usar palavras difíceis: Deus conhece nossas necessidades antes mesmo de pedirmos (Mateus 6:8).\n\nComece agradecendo, apresente seu pedido e termine confiando na vontade de Deus. Persevere, como ensina 1 Tessalonicenses 5:17.\n\n**Oração:** Pai, ensina-me a falar contigo com fé e sinceridade. Que a Tua vontade seja feita em minha vida, conforme Mateus 6:10. Amém.",
  },
  {
    terms: ["perdao", "perdoar", "perdão", "culpa", "pecado"],
    response:
      "## Perdão e recomeço\n\nA Escritura ensina que, quando confessamos nossos pecados, Deus é fiel e justo para nos perdoar e purificar (1 João 1:9). Em Cristo não precisamos viver condenados, pois há nova vida para quem nele está (Romanos 8:1).\n\nTambém somos chamados a perdoar como fomos perdoados, sem confundir perdão com permanecer em situações de abuso ou perigo (Efésios 4:32). O perdão pode ser um processo, conduzido com oração, sabedoria e limites saudáveis.\n\n**Para refletir:** você precisa hoje receber o perdão de Deus ou começar a liberar perdão a alguém?",
  },
  {
    terms: ["salvacao", "salvação", "salvo", "vida eterna", "evangelho"],
    response:
      "## A salvação na Bíblia\n\nA salvação é presente da graça de Deus, recebido pela fé em Jesus Cristo — não uma recompensa por boas obras (Efésios 2:8-9). A Bíblia ensina que todos pecaram, mas Deus oferece gratuitamente a vida eterna em Cristo (Romanos 3:23; Romanos 6:23).\n\nResponder ao evangelho envolve arrependimento e fé: voltar-se para Deus e confiar em Jesus como Senhor e Salvador (Marcos 1:15; Romanos 10:9-10). As boas obras passam a ser fruto dessa nova vida, não o preço dela (Efésios 2:10).",
  },
  {
    terms: ["fe", "fé", "confiar", "duvida", "dúvida"],
    response:
      "## Fé em meio às dúvidas\n\nA fé bíblica é confiança em Deus e em suas promessas, mesmo quando ainda não vemos tudo com clareza (Hebreus 11:1). Ter dúvidas não impede você de se aproximar de Jesus; um homem pediu: “Eu creio! Ajuda-me na minha falta de fé” (Marcos 9:24).\n\nFortaleça sua fé ouvindo a Palavra, orando com honestidade e caminhando com outros cristãos (Romanos 10:17; Hebreus 10:24-25). Deus não despreza quem o busca com sinceridade.",
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Resposta bíblica local para manter o mesmo assistente disponível sem cobrar o usuário. */
export function getBiblicalFallbackAnswer(question: string): string {
  const normalized = normalize(question);
  const topic = TOPICS.find(({ terms }) =>
    terms.some((term) => normalized.includes(normalize(term))),
  );
  if (topic) return topic.response;

  if (/\b(ola|oi|bom dia|boa tarde|boa noite)\b/.test(normalized)) {
    return "Olá! Que a graça e a paz de Cristo estejam com você (Filipenses 1:2). Posso ajudar com uma passagem bíblica, uma dúvida sobre a fé, um momento de oração ou uma aplicação prática das Escrituras. O que você gostaria de conversar hoje?";
  }

  return `## Vamos olhar para isso à luz da Bíblia\n\nA Escritura nos orienta a examinar cuidadosamente tudo e reter o que é bom (1 Tessalonicenses 5:21), buscando sabedoria em Deus (Tiago 1:5). Sobre sua pergunta — “${question.slice(0, 180)}” — um bom primeiro passo é considerar o contexto bíblico, comparar passagens relacionadas e evitar conclusões baseadas em um único versículo isolado (Atos 17:11).\n\nVocê pode reformular a pergunta indicando um tema ou uma passagem específica. Assim, consigo oferecer uma explicação bíblica mais direcionada. **Para refletir:** qual texto das Escrituras despertou essa dúvida em você?`;
}