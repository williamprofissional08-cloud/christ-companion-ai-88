import { describe, expect, it } from "vitest";
import { secondCorinthians3Study } from "./second-corinthians-3-study";

describe("2 Coríntios 3 — integridade editorial", () => {
  it("cobre os 18 versículos em ordem e sem repetição", () => {
    const verses = secondCorinthians3Study.sections?.filter(s => /^versiculo-\d+$/.test(s.id)) ?? [];
    expect(verses.map(s => s.id)).toEqual(Array.from({ length: 18 }, (_, i) => `versiculo-${i + 1}`));
    verses.forEach((s, i) => {
      expect(s.scriptureRefs).toContain(`2 Coríntios 3:${i + 1}`);
      expect(s.body).toContain("Paráfrase livre");
    });
  });
  it("possui IDs únicos, perícopes, referências e oficina", () => {
    const sections = secondCorinthians3Study.sections ?? [];
    expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
    expect(sections.filter(s => s.id.startsWith("pericope-"))).toHaveLength(5);
    for (const id of ["leitura-aviso", "contexto-literario", "interpretacao-inferencia", "referencias-comentadas", "perguntas-respondidas", "aplicacao-pratica", "oficina-pregador", "oracao-final"]) expect(sections.some(s => s.id === id)).toBe(true);
    expect(secondCorinthians3Study.crossReferences.length).toBeGreaterThanOrEqual(5);
  });
});
