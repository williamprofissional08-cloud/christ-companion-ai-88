import type { StudyContent } from "./types";
import type { StudySection } from "./study-reader";

/** Supports cached studies created before structured sections were introduced. */
export function studySections(content: StudyContent): StudySection[] {
  if (Array.isArray(content.sections) && content.sections.length) {
    return content.sections.map(({ kind: _kind, ...section }) => section);
  }
  return [
    { id: "intro", title: "Introdução", body: content.intro },
    { id: "context", title: "Contexto histórico", body: content.historicalContext },
    ...(content.keyPoints ?? []).map((point, index) => ({ id: `point-${index}`, title: point.title, body: point.text })),
    { id: "application", title: "Aplicação prática", body: content.application },
    { id: "references", title: "Referências cruzadas", body: (content.crossReferences ?? []).join("\n") },
    { id: "questions", title: "Perguntas para reflexão", body: (content.questions ?? []).map((question, index) => `${index + 1}. ${question}`).join("\n\n") },
    { id: "conclusion", title: "Conclusão", body: content.conclusion },
    { id: "prayer", title: "Oração final", body: content.prayer },
  ].filter((section) => Boolean(section.body));
}