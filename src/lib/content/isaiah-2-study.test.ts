import { describe, expect, it } from "vitest";
import { isaiah2Study } from "./isaiah-2-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 2 — estudo", () => {
  it("está integrado no catálogo", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-2"]).toBe(isaiah2Study);
  });
  it("possui leitura livre e exposição dos 22 versículos", () => {
    const reading = isaiah2Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 22; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(isaiah2Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes, interpretações e formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-paz", "pericope-idolatria", "pericope-dia", "pericope-fuga", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(isaiah2Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(isaiah2Study.sections.map((s) => s.id)).size).toBe(isaiah2Study.sections.length);
  });
});
