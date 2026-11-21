import { describe, expect, it } from "vitest";
import { isaiah1Study } from "./isaiah-1-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 1 — estudo", () => {
  it("está integrado no catálogo", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-1"]).toBe(isaiah1Study);
  });
  it("possui leitura livre e exposição dos 31 versículos", () => {
    const reading = isaiah1Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase original");
    for (let verse = 1; verse <= 31; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(isaiah1Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui as cinco perícopes, contexto e formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-acusacao", "pericope-culto", "pericope-convite", "pericope-restauracao", "pericope-juizo", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(isaiah1Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(isaiah1Study.sections.map((s) => s.id)).size).toBe(isaiah1Study.sections.length);
  });
});
