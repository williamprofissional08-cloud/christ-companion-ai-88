import { describe, expect, it } from "vitest";
import { isaiah5Study } from "./isaiah-5-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 5 — estudo", () => {
  it("está integrado ao catálogo", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-5"]).toBe(isaiah5Study);
  });
  it("inclui leitura e exposição dos 30 versículos", () => {
    const reading = isaiah5Study.sections?.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase original");
    for (let verse = 1; verse <= 30; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(isaiah5Study.sections?.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui cinco perícopes e material de formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-vinha", "pericope-terras", "pericope-festas", "pericope-ais", "pericope-juizo", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(isaiah5Study.sections?.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(isaiah5Study.sections?.map((s) => s.id)).size).toBe(isaiah5Study.sections?.length);
  });
});
