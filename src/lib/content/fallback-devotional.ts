import type { DevotionalContent } from "@/lib/types";

/**
 * Devocionais de reserva (sem IA), usados quando a geração por IA está
 * temporariamente indisponível. Todos citam referências bíblicas completas.
 */
const FALLBACKS: DevotionalContent[] = [
  {
    theme: "Descanso na presença de Deus",
    verse: {
      reference: "Salmos 23:1-3",
      text: "O Senhor é o meu pastor; nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas. Refrigera a minha alma.",
    },
    reflection:
      "Deus se apresenta como pastor, não como um mero observador distante. Em Salmos 23:1-3, Davi confessa que a supervisão do Senhor basta para a sua vida.\n\nQuem tem o Senhor por pastor aprende a descansar. O descanso aqui não é ausência de trabalho, mas confiança em quem cuida.\n\nHoje, entregue a Deus aquilo que você tem tentado carregar sozinho, como convida 1 Pedro 5:7.",
    application:
      "Reserve dez minutos em silêncio, leia Salmos 23:1-3 em voz alta e escreva uma preocupação que você deseja entregar a Deus hoje (1 Pedro 5:7).",
    prayer:
      "Senhor, Tu és o meu pastor e nada me faltará, como declara Salmos 23:1. Aquieta o meu coração, guia-me a águas tranquilas e refrigera a minha alma. Ajuda-me a lançar sobre Ti toda a minha ansiedade, porque Tu tens cuidado de mim (1 Pedro 5:7). Em nome de Jesus, amém.",
    challenge:
      "Escolha um momento do dia para orar sem pressa, meditando em Salmos 23:1-3.",
    question:
      "Em que área da sua vida você ainda tenta ser o seu próprio pastor, em vez de confiar em Salmos 23:1?",
    motivational:
      "Deus não apenas caminha ao seu lado, Ele vai à frente: \"O Senhor é o meu pastor; nada me faltará\" (Salmos 23:1).",
    readingSuggestion: "Salmos 23:1-6 e 1 Pedro 5:6-11",
  },
  {
    theme: "Paz no lugar da ansiedade",
    verse: {
      reference: "Filipenses 4:6-7",
      text: "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica com ação de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.",
    },
    reflection:
      "Paulo escreve Filipenses 4:6-7 preso, e ainda assim fala de paz. Isso mostra que a paz cristã não depende das circunstâncias, mas de a quem levamos as nossas circunstâncias.\n\nO texto substitui a inquietação por três atitudes: oração, súplica e gratidão.\n\nA promessa não é a ausência de problemas, mas um coração guardado por Deus, como também ensina Isaías 26:3.",
    application:
      "Escreva três pedidos e três agradecimentos. Ore por eles seguindo o modelo de Filipenses 4:6.",
    prayer:
      "Pai, obedeço ao Teu convite de não andar ansioso por coisa alguma (Filipenses 4:6). Recebo hoje a Tua paz que excede todo o entendimento e peço que ela guarde o meu coração e a minha mente em Cristo Jesus (Filipenses 4:7). Amém.",
    challenge:
      "Cada vez que a ansiedade surgir hoje, repita Filipenses 4:6-7 e transforme a preocupação em oração.",
    question:
      "O que você precisa entregar em oração hoje, em vez de continuar carregando (Filipenses 4:6)?",
    motivational:
      "A paz de Deus guarda o que você não consegue controlar (Filipenses 4:7).",
    readingSuggestion: "Filipenses 4:4-9 e Isaías 26:3-4",
  },
  {
    theme: "Força renovada para caminhar",
    verse: {
      reference: "Isaías 40:31",
      text: "Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.",
    },
    reflection:
      "Isaías 40:31 fala a um povo cansado. A promessa não é fuga do caminho, mas força para percorrê-lo.\n\nEsperar no Senhor é uma atitude ativa de confiança: continuar orando, obedecendo e servindo enquanto Deus age.\n\nJesus faz o mesmo convite em Mateus 11:28-30, oferecendo descanso a quem está sobrecarregado.",
    application:
      "Identifique uma tarefa que tem drenado suas forças e ore especificamente por ela, apoiando-se em Isaías 40:31.",
    prayer:
      "Senhor, eu espero em Ti. Renova as minhas forças como prometeste em Isaías 40:31, para que eu corra sem me cansar e caminhe sem me fatigar. Ensina-me a tomar sobre mim o Teu jugo suave, como convida Jesus em Mateus 11:28-30. Amém.",
    challenge: "Faça hoje um ato de serviço a alguém, confiando na força de Isaías 40:31.",
    question: "O que significaria, na prática, esperar no Senhor nesta semana (Isaías 40:31)?",
    motivational: "Quem espera no Senhor não caminha com as próprias forças (Isaías 40:31).",
    readingSuggestion: "Isaías 40:27-31 e Mateus 11:28-30",
  },
];

/** Escolhe um devocional de reserva de forma estável para o dia informado. */
export function fallbackDevotional(day: string): DevotionalContent {
  let sum = 0;
  for (const char of day) sum += char.charCodeAt(0);
  return FALLBACKS[sum % FALLBACKS.length]!;
}
