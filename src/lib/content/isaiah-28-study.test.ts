import { describe, expect, it } from "vitest";
import { isaiah28Study } from "./isaiah-28-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 28", () => {
  it("integra o estudo sem duplicar o slug", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-28"]).toBe(isaiah28Study);
  });
  it("contém leitura e comentários específicos dos 29 versículos", () => {
    const sections = isaiah28Study.sections ?? [];
    const reading = sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("BLIVRE");
    for (let verse = 1; verse <= 29; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
  });
  it("contém quatro perícopes, debate interpretativo e formação", () => {
    const ids = new Set((isaiah28Study.sections ?? []).map((s) => s.id));
    for (const id of ["pericope-1", "pericope-2", "pericope-3", "pericope-4", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
