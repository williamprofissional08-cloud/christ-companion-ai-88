import { describe, expect, it } from "vitest";
import { isaiah7Study } from "./isaiah-7-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 7 — estudo", () => {
  it("está integrado ao catálogo", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-7"]).toBe(isaiah7Study);
  });
  it("inclui leitura e exposição dos 25 versículos", () => {
    const reading = isaiah7Study.sections?.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 25; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(isaiah7Study.sections?.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes e formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-crise", "pericope-emanuel", "pericope-assiria", "pericope-terra", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(isaiah7Study.sections?.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(isaiah7Study.sections?.map((s) => s.id)).size).toBe(isaiah7Study.sections?.length);
  });
});
