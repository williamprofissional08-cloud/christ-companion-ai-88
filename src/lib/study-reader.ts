export type StudyDepth = "simple" | "deep";

export type StudyConfidence = "high" | "probable" | "debated" | "uncertain";

export type StudySectionKind =
  | "introduction"
  | "scripture"
  | "context"
  | "analysis"
  | "theology"
  | "cross-references"
  | "application"
  | "reflection"
  | "summary"
  | "challenge"
  | "sources"
  | "reasoning"
  | "other";

export type StudySection = {
  id: string;
  title: string;
  body: string;
  kind?: StudySectionKind;
  scriptureRefs?: string[];
  confidence?: StudyConfidence;
  collapsible?: boolean;
};

export type SpeechUnit = {
  id: string;
  sectionIndex: number;
  text: string;
};

export const STUDY_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type StudyPlaybackRate = (typeof STUDY_PLAYBACK_RATES)[number];

const SENTENCE_PATTERN = /[^.!?;:\n]+[.!?;:\n]*\s*/g;

function splitLongSentence(sentence: string, maxChars: number): string[] {
  const words = sentence.trim().split(/\s+/);
  const parts: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      parts.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** Unidades curtas evitam os cancelamentos comuns do speechSynthesis no Android. */
export function buildSpeechUnits(sections: StudySection[], maxChars = 220): SpeechUnit[] {
  return sections.flatMap((section, sectionIndex) => {
    const source = `${section.title}. ${section.body}`
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^\s*[-*+>]\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
      .replace(/[ \t]+/g, " ")
      .trim();
    const sentences = source.match(SENTENCE_PATTERN) ?? [source];
    const chunks: string[] = [];
    let current = "";
    const flush = () => {
      if (current.trim()) chunks.push(current.trim());
      current = "";
    };
    for (const sentence of sentences) {
      if (sentence.length > maxChars) {
        flush();
        chunks.push(...splitLongSentence(sentence, maxChars));
      } else if (`${current} ${sentence}`.trim().length > maxChars) {
        flush();
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }
    flush();
    return chunks.map((text, chunkIndex) => ({
      id: `${section.id}-${chunkIndex}`,
      sectionIndex,
      text,
    }));
  });
}

export function confidenceLabel(confidence: StudyConfidence): string {
  if (confidence === "high") return "Alta confiança";
  if (confidence === "probable") return "Interpretação provável";
  if (confidence === "debated") return "Questão debatida";
  return "Não é possível afirmar com segurança";
}