export type Study = {
  slug: string;
  title: string;
  category: string;
  reference: string;
  summary: string;
};

export const STUDY_CATEGORIES = [
  "Livros da Bíblia",
  "Personagens",
  "Milagres",
  "Parábolas",
  "Profecias",
  "Evangelhos",
  "Cartas",
  "Antigo Testamento",
  "Novo Testamento",
  "Doutrinas",
  "Temas",
] as const;

function study(
  slug: string,
  title: string,
  category: string,
  reference: string,
  summary: string,
): Study {
  return { slug, title, category, reference, summary };
}

export const STUDIES: Study[] = [
  study("genesis-panorama", "Gênesis: as origens", "Livros da Bíblia", "Gênesis 1—50", "Criação, queda, aliança e a promessa da semente."),
  study("exodo-libertacao", "Êxodo: o Deus que liberta", "Livros da Bíblia", "Êxodo 1—40", "Do cativeiro à presença: páscoa, lei e tabernáculo."),
  study("salmos-oracao", "Salmos: a escola da oração", "Livros da Bíblia", "Salmos", "Como orar com sinceridade em todas as estações da alma."),
  study("provérbios-sabedoria", "Provérbios: sabedoria prática", "Livros da Bíblia", "Provérbios", "Temor do Senhor, palavras, trabalho, amizades e dinheiro."),
  study("isaias-messias", "Isaías: o Servo Sofredor", "Profecias", "Isaías 53", "A profecia messiânica cumprida em Jesus."),
  study("joao-evangelho", "João: para que creiais", "Evangelhos", "João 1—21", "Os sinais e os 'Eu sou' que revelam a divindade de Cristo."),
  study("mateus-reino", "Mateus: o Reino dos Céus", "Evangelhos", "Mateus 1—28", "Jesus como o Rei prometido e o Sermão do Monte."),
  study("marcos-servo", "Marcos: o Servo em ação", "Evangelhos", "Marcos 1—16", "Um evangelho ágil sobre poder e serviço."),
  study("lucas-misericordia", "Lucas: a misericórdia alcança", "Evangelhos", "Lucas 1—24", "Jesus e os excluídos: graça para todos."),
  study("atos-igreja", "Atos: o nascimento da igreja", "Novo Testamento", "Atos 1—28", "O Espírito Santo, a missão e a coragem dos primeiros cristãos."),
  study("romanos-evangelho", "Romanos: o evangelho explicado", "Cartas", "Romanos 1—16", "Pecado, justificação pela fé, santificação e vida no Espírito."),
  study("efesios-identidade", "Efésios: em Cristo", "Cartas", "Efésios 1—6", "Bênçãos espirituais, igreja e batalha espiritual."),
  study("filipenses-alegria", "Filipenses: alegria na prova", "Cartas", "Filipenses 1—4", "Contentamento e humildade a partir de uma prisão."),
  study("tiago-fe-pratica", "Tiago: fé que age", "Cartas", "Tiago 1—5", "Fé viva, língua, provações e oração eficaz."),
  study("hebreus-superioridade", "Hebreus: Cristo é superior", "Cartas", "Hebreus 1—13", "O sacerdócio perfeito e a nova aliança."),
  study("apocalipse-esperanca", "Apocalipse: a esperança final", "Profecias", "Apocalipse 1—22", "Cristo vitorioso e a nova Jerusalém, com humildade interpretativa."),
  study("abraao-fe", "Abraão: o pai da fé", "Personagens", "Gênesis 12—22", "Chamado, aliança e obediência custosa."),
  study("moises-lideranca", "Moisés: liderança e intimidade", "Personagens", "Êxodo 3—34", "Da sarça ardente ao rosto que resplandece."),
  study("davi-coracao", "Davi: um homem segundo o coração de Deus", "Personagens", "1 Samuel 16 — 2 Samuel 24", "Adoração, queda, arrependimento e restauração."),
  study("ester-coragem", "Ester: coragem no tempo certo", "Personagens", "Ester 1—10", "Providência divina e ação corajosa."),
  study("jose-do-egito", "José: o sonho e o perdão", "Personagens", "Gênesis 37—50", "Deus transforma o mal em bem."),
  study("pedro-restauracao", "Pedro: da negação à restauração", "Personagens", "Lucas 22; João 21", "A graça que reconstrói vocações."),
  study("paulo-transformacao", "Paulo: graça transformadora", "Personagens", "Atos 9; Gálatas 1", "Do perseguidor ao apóstolo dos gentios."),
  study("maria-serva", "Maria: eis-me aqui", "Personagens", "Lucas 1", "Entrega e fé diante do impossível."),
  study("filho-prodigo", "A parábola do filho pródigo", "Parábolas", "Lucas 15:11-32", "O coração do Pai que corre ao encontro."),
  study("bom-samaritano", "O bom samaritano", "Parábolas", "Lucas 10:25-37", "Quem é o meu próximo?"),
  study("semeador", "A parábola do semeador", "Parábolas", "Mateus 13:1-23", "Quatro tipos de coração diante da Palavra."),
  study("talentos", "A parábola dos talentos", "Parábolas", "Mateus 25:14-30", "Fidelidade e mordomia enquanto o Senhor não volta."),
  study("ovelha-perdida", "A ovelha perdida", "Parábolas", "Lucas 15:1-7", "O valor de uma única alma."),
  study("multiplicacao-paes", "A multiplicação dos pães", "Milagres", "João 6:1-15", "Deus multiplica o pouco entregue."),
  study("acalmando-tempestade", "Jesus acalma a tempestade", "Milagres", "Marcos 4:35-41", "Fé em meio ao caos."),
  study("cego-de-nascenca", "A cura do cego de nascença", "Milagres", "João 9", "Da escuridão à luz e ao testemunho."),
  study("ressurreicao-lazaro", "A ressurreição de Lázaro", "Milagres", "João 11", "Jesus é a ressurreição e a vida."),
  study("mar-vermelho", "A travessia do mar Vermelho", "Milagres", "Êxodo 14", "Quando não há caminho, Deus abre caminho."),
  study("doutrina-salvacao", "Salvação pela graça", "Doutrinas", "Efésios 2:8-9", "O que é a salvação e como ela se recebe."),
  study("doutrina-trindade", "Deus Trino", "Doutrinas", "Mateus 28:19", "Pai, Filho e Espírito Santo nas Escrituras."),
  study("doutrina-espirito-santo", "A pessoa do Espírito Santo", "Doutrinas", "João 14:16-17", "Consolador, guia e poder para viver."),
  study("doutrina-igreja", "A igreja: corpo de Cristo", "Doutrinas", "1 Coríntios 12", "Comunhão, dons e propósito."),
  study("doutrina-arrependimento", "Arrependimento e fé", "Doutrinas", "Atos 3:19", "Mudança de mente que gera mudança de vida."),
  study("doutrina-batismo", "Batismo e santa ceia", "Doutrinas", "Romanos 6:3-4", "Sinais da aliança, com respeito às tradições cristãs."),
  study("tema-ansiedade", "A Bíblia e a ansiedade", "Temas", "Filipenses 4:6-7", "O que fazer com o coração inquieto."),
  study("tema-perdao", "A Bíblia e o perdão", "Temas", "Mateus 18:21-35", "Perdoar como fomos perdoados."),
  study("tema-dinheiro", "A Bíblia e o dinheiro", "Temas", "1 Timóteo 6:6-10", "Contentamento, generosidade e perigos da avareza."),
  study("tema-sofrimento", "A Bíblia e o sofrimento", "Temas", "Romanos 8:18-28", "Esperança quando dói."),
  study("tema-oracao", "A Bíblia e a oração", "Temas", "Lucas 11:1-13", "Como Jesus ensinou a orar."),
  study("tema-jejum", "A Bíblia e o jejum", "Temas", "Isaías 58", "Jejum que agrada a Deus."),
  study("antigo-testamento-panorama", "Panorama do Antigo Testamento", "Antigo Testamento", "Gênesis a Malaquias", "A história da promessa em 39 livros."),
  study("novo-testamento-panorama", "Panorama do Novo Testamento", "Novo Testamento", "Mateus a Apocalipse", "O cumprimento em Cristo e a missão da igreja."),
  study("profecias-messianicas", "Profecias messiânicas", "Profecias", "Miqueias 5:2; Zacarias 9:9", "Sinais anunciados séculos antes de Jesus."),
  study("profecia-daniel", "As visões de Daniel", "Profecias", "Daniel 2; 7", "Reinos que passam e o Reino que permanece."),
];

export function getStudy(slug: string) {
  return STUDIES.find((s) => s.slug === slug);
}
