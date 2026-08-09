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

export type TrackStepContent = {
  title: string;
  reading: string;
  readingSummary: string;
  meditation: string;
  prayer: string;
  challenge: string;
  questions: string[];
  references: string[];
};

export type UserSettings = {
  user_id: string;
  onboarding_completed: boolean;
  interests: string[];
  daily_goal: string | null;
  reminder_time: string;
  reading_minutes: number;
  challenge_type: string;
  reminders_enabled: boolean;
  timezone: string;
  reminder_repeat: string;
  reminder_paused_until: string | null;
};

export const REMINDER_REPEATS = [
  { key: "diario", label: "Todos os dias" },
  { key: "semana", label: "Somente dias de semana" },
  { key: "fimdesemana", label: "Somente fins de semana" },
  { key: "duasvezes", label: "Duas vezes ao dia (manhã e noite)" },
] as const;

export const TIMEZONE_OPTIONS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Rio_Branco",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Lisbon",
  "Europe/London",
  "Africa/Luanda",
  "Africa/Maputo",
] as const;

export const PAUSE_OPTIONS = [
  { key: "0", label: "Sem pausa" },
  { key: "1", label: "Pausar 1 dia" },
  { key: "3", label: "Pausar 3 dias" },
  { key: "7", label: "Pausar 7 dias" },
  { key: "30", label: "Pausar 30 dias" },
] as const;


export const INTEREST_OPTIONS = [
  "Ansiedade",
  "Fé",
  "Oração",
  "Perdão",
  "Identidade",
  "Propósito",
  "Gratidão",
  "Esperança",
  "Família",
  "Casamento",
  "Trabalho",
  "Cura",
  "Santificação",
  "Evangelismo",
] as const;

export const CHALLENGE_TYPES = [
  { key: "oracao", label: "Oração", hint: "Desafios voltados a orar mais e melhor." },
  { key: "leitura", label: "Leitura bíblica", hint: "Desafios de leitura e memorização." },
  { key: "servico", label: "Serviço ao próximo", hint: "Desafios práticos de amor e serviço." },
  { key: "jejum", label: "Jejum e consagração", hint: "Desafios de renúncia e consagração." },
  { key: "equilibrado", label: "Equilibrado", hint: "Um pouco de cada área a cada dia." },
] as const;

export const READING_DURATIONS = [5, 10, 15, 20, 30, 45] as const;
