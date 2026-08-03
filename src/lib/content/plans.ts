export type PrayerPlan = {
  slug: string;
  title: string;
  category: string;
  days: number;
  summary: string;
  keyVerse: string;
};

function plan(
  slug: string,
  title: string,
  category: string,
  days: number,
  summary: string,
  keyVerse: string,
): PrayerPlan {
  return { slug, title, category, days, summary, keyVerse };
}

export const PLAN_CATEGORIES = [
  "Intimidade",
  "Família",
  "Emoções",
  "Fé e Caráter",
  "Provisão e Trabalho",
  "Disciplinas",
  "Missão",
] as const;

export const PRAYER_PLANS: PrayerPlan[] = [
  plan("intimidade-com-deus", "Intimidade com Deus", "Intimidade", 21, "Aprenda a buscar a presença de Deus todos os dias e cultivar um coração sensível ao Espírito.", "Salmos 27:4"),
  plan("secreto-com-o-pai", "O lugar secreto com o Pai", "Intimidade", 14, "Um plano sobre oração escondida, silêncio e comunhão constante.", "Mateus 6:6"),
  plan("conhecer-a-jesus", "Conhecer a Jesus de perto", "Intimidade", 30, "Caminhe pelos Evangelhos contemplando quem Jesus é e como Ele ama.", "Filipenses 3:10"),
  plan("adoracao-verdadeira", "Adoração verdadeira", "Intimidade", 10, "Adorar em espírito e em verdade como estilo de vida, não apenas como música.", "João 4:23-24"),
  plan("ouvir-a-voz-de-deus", "Ouvir a voz de Deus", "Intimidade", 14, "Discernir a direção de Deus pela Palavra, pelo Espírito e pela paz.", "João 10:27"),
  plan("libertacao-espiritual", "Libertação espiritual", "Fé e Caráter", 21, "Vitória em Cristo sobre vícios, culpas e opressões, à luz das Escrituras.", "João 8:36"),
  plan("armadura-de-deus", "A armadura de Deus", "Fé e Caráter", 7, "Cada dia, uma peça da armadura espiritual aplicada à sua vida real.", "Efésios 6:10-18"),
  plan("familia-abencoada", "Família abençoada", "Família", 21, "Ore por cada membro da sua casa e construa um lar sobre a Rocha.", "Josué 24:15"),
  plan("casamento-restaurado", "Casamento restaurado", "Família", 30, "Perdão, comunicação, aliança e amor sacrificial no casamento.", "Efésios 5:25"),
  plan("orando-pelos-filhos", "Orando pelos filhos", "Família", 21, "Intercessão diária pela fé, caráter e futuro dos seus filhos.", "Provérbios 22:6"),
  plan("pais-presentes", "Pais presentes", "Família", 14, "Discipulado dentro de casa: ensinar a Palavra com vida e presença.", "Deuteronômio 6:6-7"),
  plan("solteiro-em-proposito", "Solteiro em propósito", "Família", 14, "Viver a solteirice com santidade, alvo e alegria em Cristo.", "1 Coríntios 7:32-35"),
  plan("vencendo-a-ansiedade", "Vencendo a ansiedade", "Emoções", 21, "Troque a inquietação pela paz que excede todo entendimento.", "Filipenses 4:6-7"),
  plan("libertos-do-medo", "Libertos do medo", "Emoções", 14, "A perfeita caridade lança fora o medo: promessas para o coração aflito.", "Isaías 41:10"),
  plan("cura-da-alma", "Cura da alma", "Emoções", 21, "Deus cura memórias, feridas e tristezas profundas.", "Salmos 147:3"),
  plan("vencendo-a-tristeza", "Vencendo a tristeza", "Emoções", 14, "Salmos de lamento e esperança para dias cinzentos.", "Salmos 42:11"),
  plan("dominando-a-ira", "Dominando a ira", "Emoções", 10, "Mansidão, paciência e domínio próprio pelo Espírito.", "Tiago 1:19-20"),
  plan("perdao-que-liberta", "O perdão que liberta", "Emoções", 14, "Perdoar como fomos perdoados, mesmo quando dói.", "Colossenses 3:13"),
  plan("fe-que-move", "Fé que move montanhas", "Fé e Caráter", 21, "Fé bíblica: confiança na fidelidade de Deus, não em nossos sentimentos.", "Hebreus 11:1"),
  plan("sabedoria-de-deus", "Sabedoria de Deus", "Fé e Caráter", 31, "Um capítulo de Provérbios por dia com aplicação prática.", "Provérbios 2:6"),
  plan("santificacao-diaria", "Santificação diária", "Fé e Caráter", 30, "Escolhas santas no cotidiano, pela graça e não pelo esforço próprio.", "1 Tessalonicenses 4:3"),
  plan("humildade-e-mansidao", "Humildade e mansidão", "Fé e Caráter", 14, "Aprender do coração de Jesus, manso e humilde.", "Mateus 11:29"),
  plan("gratidao-em-tudo", "Gratidão em tudo", "Fé e Caráter", 21, "Um coração agradecido transforma a maneira de ver a vida.", "1 Tessalonicenses 5:18"),
  plan("identidade-em-cristo", "Identidade em Cristo", "Fé e Caráter", 21, "Quem você é segundo a Palavra, e não segundo suas falhas.", "Efésios 1:4-6"),
  plan("prosperidade-biblica", "Prosperidade segundo a Bíblia", "Provisão e Trabalho", 21, "Mordomia, contentamento, generosidade e trabalho honesto.", "Provérbios 3:9-10"),
  plan("trabalho-como-culto", "Trabalho como culto", "Provisão e Trabalho", 14, "Fazer tudo como para o Senhor, com excelência e integridade.", "Colossenses 3:23"),
  plan("provisao-de-deus", "A provisão de Deus", "Provisão e Trabalho", 14, "Promessas de sustento para tempos de escassez.", "Filipenses 4:19"),
  plan("liberdade-financeira", "Liberdade das dívidas", "Provisão e Trabalho", 21, "Princípios bíblicos de disciplina, planejamento e contentamento.", "Provérbios 22:7"),
  plan("estudos-e-provas", "Estudos e provas", "Provisão e Trabalho", 14, "Diligência, memória e paz para a temporada de estudos.", "Daniel 1:17"),
  plan("proposito-de-vida", "Propósito de vida", "Missão", 21, "Descobrir o chamado de Deus e obedecer um passo por vez.", "Efésios 2:10"),
  plan("evangelismo-com-amor", "Evangelismo com amor", "Missão", 14, "Compartilhar o evangelho com naturalidade e compaixão.", "Romanos 1:16"),
  plan("intercessao-pelas-nacoes", "Intercessão pelas nações", "Missão", 21, "Ore pelo mundo com o coração do Pai.", "Salmos 2:8"),
  plan("servir-a-igreja", "Servir a igreja", "Missão", 14, "Dons espirituais, corpo de Cristo e serviço alegre.", "1 Pedro 4:10"),
  plan("amor-ao-proximo", "Amor ao próximo", "Missão", 21, "Amar em obras e em verdade, começando por quem está perto.", "1 João 3:18"),
  plan("jejum-biblico", "Jejum bíblico", "Disciplinas", 7, "Como jejuar com o coração certo e o que a Bíblia ensina.", "Mateus 6:16-18"),
  plan("consagracao-40-dias", "Consagração de 40 dias", "Disciplinas", 40, "Uma jornada intensa de entrega, oração e obediência.", "Romanos 12:1"),
  plan("disciplina-espiritual", "Disciplinas espirituais", "Disciplinas", 21, "Oração, Palavra, silêncio, generosidade e comunhão.", "1 Timóteo 4:7-8"),
  plan("memorizando-a-palavra", "Memorizando a Palavra", "Disciplinas", 30, "Um versículo por dia guardado no coração.", "Salmos 119:11"),
  plan("cheio-do-espirito", "Cheio do Espírito Santo", "Disciplinas", 21, "Quem é o Espírito Santo e como andar em Seu poder e fruto.", "Gálatas 5:22-25"),
  plan("leitura-dos-evangelhos", "Leitura dos Evangelhos", "Disciplinas", 30, "Percorra a vida de Jesus em um mês de leitura guiada.", "João 20:31"),
  plan("cura-e-saude", "Cura e saúde", "Emoções", 14, "Orar pela cura com fé, confiança e submissão à vontade de Deus.", "Tiago 5:14-15"),
  plan("esperanca-no-luto", "Esperança no luto", "Emoções", 14, "Consolo bíblico para quem perdeu alguém amado.", "1 Tessalonicenses 4:13-14"),
];

export function getPlan(slug: string) {
  return PRAYER_PLANS.find((p) => p.slug === slug);
}
