import { describe, expect, it } from "vitest";
import { isaiah4Study } from "./isaiah-4-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 4 — estudo", () => {
  it("está integrado no catálogo", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-4"]).toBe(isaiah4Study);
  });
  it("inclui leitura livre e exposição dos 6 versículos", () => {
    const reading = isaiah4Study.sections?.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 6; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(isaiah4Study.sections?.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui quatro perícopes e formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-guerra", "pericope-renovo", "pericope-purificacao", "pericope-protecao", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(isaiah4Study.sections?.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(isaiah4Study.sections?.map((s) => s.id)).size).toBe(isaiah4Study.sections?.length);
  });
});
