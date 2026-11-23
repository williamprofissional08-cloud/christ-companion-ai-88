import { describe, expect, it } from "vitest";
import { isaiah6Study } from "./isaiah-6-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Isaías 6 — estudo", () => {
  it("está integrado ao catálogo", () => {
    expect(CURATED_STUDIES["biblia-isaias-cap-6"]).toBe(isaiah6Study);
  });
  it("inclui leitura e exposição dos 13 versículos", () => {
    const reading = isaiah6Study.sections?.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase original");
    for (let verse = 1; verse <= 13; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(isaiah6Study.sections?.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui cinco perícopes e formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-visao", "pericope-purificacao", "pericope-envio", "pericope-endurecimento", "pericope-remanescente", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(isaiah6Study.sections?.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(isaiah6Study.sections?.map((s) => s.id)).size).toBe(isaiah6Study.sections?.length);
  });
});
