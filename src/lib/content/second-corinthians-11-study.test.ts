import { describe, expect, it } from "vitest";
import { secondCorinthians11Study } from "./second-corinthians-11-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("2 Coríntios 11 — integridade", () => {
  it("cobre 33 versículos em ordem com paráfrase sinalizada", () => {
    const reading = secondCorinthians11Study.sections.find((section) => section.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    for (let verse = 1; verse <= 33; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(secondCorinthians11Study.sections.some((section) => section.id === `versiculo-${verse}` && section.scriptureRefs?.includes(`2 Coríntios 11:${verse}`))).toBe(true);
    }
  });
  it("possui IDs únicos e seções essenciais", () => {
    const ids = secondCorinthians11Study.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["contexto", "estrutura", "interpretacao", "referencias", "aplicacoes", "perguntas", "oficina", "oracao-final"]) {
      expect(ids).toContain(id);
    }
  });
  it("usa o slug existente do catálogo uma vez", () => {
    expect(CURATED_STUDIES["biblia-2-corintios-cap-11"]).toBe(secondCorinthians11Study);
  });
});
