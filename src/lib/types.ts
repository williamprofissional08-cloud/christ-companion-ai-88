export type DevotionalContent = {
  theme: string;
  verse: { reference: string; text: string; kind?: "verse" | "synthesis" };
  reflection: string;
  application: string;
  prayer: string;
  challenge: string;
  question: string;
  motivational: string;
  readingSuggestion: string;
};