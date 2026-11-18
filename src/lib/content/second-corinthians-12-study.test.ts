import { describe, expect, it } from "vitest";
import { secondCorinthians12Study } from "./second-corinthians-12-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("2 Coríntios 12 — integridade editorial", () => {
  it("registra o capítulo no catálogo", () => {
    expect(CURATED_STUDIES["biblia-2-corintios-cap-12"]).toBe(secondCorinthians12Study);
  });
  it("cobre os 21 versículos e possui IDs estáveis", () => {
    const sections = secondCorinthians12Study.sections ?? [];
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
    for (let verse = 1; verse <= 21; verse++) {
      expect(sections.some((s) => s.id === `versiculo-${verse}` && s.scriptureRefs?.includes(`2 Coríntios 12:${verse}`))).toBe(true);
    }
    const reading = sections.find((s) => s.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    for (let verse = 1; verse <= 21; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
    }
  });
  it("contém interpretação, aplicação, perguntas, oficina e oração", () => {
    const kinds = secondCorinthians12Study.sections.map((s) => s.kind);
    for (const kind of ["scripture", "exposition", "application", "question", "exercise", "prayer"]) expect(kinds).toContain(kind);
  });
});
