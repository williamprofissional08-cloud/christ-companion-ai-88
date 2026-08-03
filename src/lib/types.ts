export type DevotionalContent = {
  theme: string;
  verse: { reference: string; text: string };
  reflection: string;
  application: string;
  prayer: string;
  challenge: string;
  question: string;
  motivational: string;
  readingSuggestion: string;
};

export type PlanDayContent = {
  title: string;
  reading: string;
  readingSummary: string;
  meditation: string;
  prayer: string;
  challenge: string;
  question: string;
};

export type StudyContent = {
  intro: string;
  historicalContext: string;
  keyPoints: { title: string; text: string }[];
  application: string;
  crossReferences: string[];
  questions: string[];
  conclusion: string;
  prayer: string;
};

export type SearchContent = {
  overview: string;
  verses: { reference: string; text: string; note: string }[];
  practical: string[];
  prayer: string;
  studySuggestions: string[];
};

export const HABIT_ITEMS = [
  { key: "orei", label: "Orei" },
  { key: "biblia", label: "Li a Bíblia" },
  { key: "devocional", label: "Fiz o devocional" },
  { key: "memorizei", label: "Memorizei um versículo" },
  { key: "gratidao", label: "Agradeci a Deus" },
  { key: "evangelizei", label: "Evangelizei" },
  { key: "perdao", label: "Pratiquei o perdão" },
] as const;

export const JOURNAL_KINDS = [
  { key: "pedido", label: "Pedido de oração" },
  { key: "resposta", label: "Resposta de oração" },
  { key: "testemunho", label: "Testemunho" },
  { key: "gratidao", label: "Gratidão" },
  { key: "aprendizado", label: "Aprendizado" },
] as const;

export function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
