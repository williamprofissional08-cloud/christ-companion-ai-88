import { describe, expect, it } from "vitest";
import { isaiah3Study } from "./isaiah-3-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 3 — estudo", () => {
  it("está integrado ao catálogo", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-3"]).toBe(isaiah3Study);
  });
  it("inclui leitura e exposição dos 26 versículos", () => {
    const reading = isaiah3Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase original");
    for (let verse = 1; verse <= 26; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(isaiah3Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes e formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-sustento", "pericope-acusacao", "pericope-tribunal", "pericope-adorno", "pericope-lamento", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(isaiah3Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(isaiah3Study.sections.map((s) => s.id)).size).toBe(isaiah3Study.sections.length);
  });
});
