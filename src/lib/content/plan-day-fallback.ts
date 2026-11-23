import type { PrayerPlan } from "./plans";
import type { PlanDayContent } from "../types";

/**
 * Leitura de contingência baseada apenas na referência informada no catálogo.
 * Não inventa versículos, não afirma ter gerado uma exposição exegética e
 * não é gravada no cache de conteúdo. Mantém o plano acessível se a IA falhar.
 */
export function getPlanDayFallback(
  plan: Pick<PrayerPlan, "title" | "summary" | "keyVerse" | "days">,
  day: number,
): PlanDayContent {
  const steps = [
    { label: "Aproximar-se de Deus", instruction: "Leia a passagem sem pressa e anote a ideia principal apresentada no texto." },
    { label: "Entender a passagem", instruction: "Observe quem fala, a quem se dirige e qual é o contexto da passagem." },
    { label: "Examinar o coração", instruction: "Considere quais atitudes precisam ser ajustadas à luz do que você leu." },
    { label: "Orar com sinceridade", instruction: "Apresente a Deus suas necessidades sem perder de vista o sentido do texto." },
    { label: "Praticar a Palavra", instruction: "Escolha uma ação possível e coerente com a leitura de hoje." },
    { label: "Cuidar de alguém", instruction: "Pense em uma maneira concreta de servir ou encorajar outra pessoa." },
    { label: "Revisar e agradecer", instruction: "Releia suas anotações e agradeça pelas oportunidades de aprender." },
  ];
  const step = steps[(day - 1) % steps.length]!;
  return {
    title: `Dia ${day} de ${plan.days} — ${step.label}`,
    reading: plan.keyVerse,
    readingSummary: `Abra a Bíblia e leia ${plan.keyVerse} no contexto. Tema do plano: ${plan.title}. ${plan.summary}`,
    meditation: `${step.instruction} O conteúdo aprofundado deste dia está temporariamente indisponível; esta proposta de leitura guiada permite continuar orando sem atribuir frases à Bíblia que não foram conferidas. Ao ler ${plan.keyVerse}, identifique o ensinamento central e o que ele significa dentro da passagem.`,
    prayer: `Senhor Deus, ajuda-me a compreender com fidelidade a tua Palavra enquanto leio ${plan.keyVerse}. Dá-me sabedoria para colocar em prática o que aprendo, humildade para reconhecer meus limites e perseverança para buscar tua presença. Em nome de Jesus, amém.`,
    challenge: `Reserve alguns minutos para ler ${plan.keyVerse} e escrever uma aplicação prática do texto.`,
    question: "O que essa passagem ensina em seu contexto e como posso responder a esse ensinamento hoje?",
  };
}
