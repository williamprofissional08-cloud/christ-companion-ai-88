import { describe, expect, it } from "vitest";
import { romans9Study } from "./romans-9-study";

describe("Romanos 9 — integridade editorial", () => {
  it("inclui leitura livre e exposição dos 33 versículos", () => {
    const sections = romans9Study.sections;
    expect(sections.length).toBeGreaterThanOrEqual(45);
    const reading = sections.find((s) => s.id === "leitura-livre-romanos-9");
    expect(reading?.body).toContain("Material autoral de estudo");
    for (let verse = 1; verse <= 33; verse += 1) {
      expect(reading?.body).toContain(`**${verse}**`);
      expect(sections.some((s) => s.id === `exegese-verso-${verse}`)).toBe(true);
    }
  });

  it("mantém IDs únicos e os componentes editoriais", () => {
    const ids = romans9Study.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["contexto-literario", "interpretacoes-e-limites", "referencias-cruzadas", "aplicacao-e-cuidados", "perguntas-com-respostas", "oficina-do-pregador", "oracao-final"]) {
      expect(ids).toContain(id);
    }
    expect(romans9Study.crossReferences.length).toBeGreaterThanOrEqual(8);
  });
});
