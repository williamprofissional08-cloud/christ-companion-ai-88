import { describe, expect, it } from "vitest";
import { romans11Study } from "./romans-11-study";

describe("Romanos 11 — integridade editorial", () => {
  it("cobre 36 versículos com leitura livre e exposição", () => {
    const sections = romans11Study.sections;
    const reading = sections.find(s => s.id === "leitura-livre-romanos-11");
    expect(reading?.body).toContain("Material autoral de estudo");
    for (let verse = 1; verse <= 36; verse++) {
      expect(reading?.body).toContain(`**${verse}**`);
      expect(sections.some(s => s.id === `exegese-verso-${verse}`)).toBe(true);
    }
  });
  it("possui IDs únicos e seções didáticas", () => {
    const ids = romans11Study.sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["contexto-literario", "interpretacoes-e-limites", "referencias-cruzadas", "aplicacao-e-cuidados", "perguntas-com-respostas", "oficina-do-pregador", "oracao-final"]) expect(ids).toContain(id);
    expect(romans11Study.crossReferences.length).toBeGreaterThanOrEqual(8);
  });
});
