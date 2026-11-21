import { describe, expect, it } from "vitest";
import { firstTimothy3Study } from "./1-timothy-3-study";

describe("1 Timóteo 3 — integridade editorial", () => {
  it("preserva a leitura livre dos 16 versículos em ordem", () => {
    const reading = firstTimothy3Study.sections.find(s => s.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    const numbers = Array.from(reading?.body.matchAll(/\*\*(\d+)\.\*\*/g) ?? [], m => Number(m[1]));
    expect(numbers).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });
  it("preserva IDs únicos e estrutura de estudo completo", () => {
    const sections = firstTimothy3Study.sections;
    expect(sections.length).toBeGreaterThanOrEqual(30);
    expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
    for (let n = 1; n <= 16; n++) expect(sections.some(s => s.id === `versiculo-${n}`)).toBe(true);
    for (const id of ["contexto","estrutura","referencias","interpretacoes","cuidados","aplicacao","perguntas","pregador","oracao"]) {
      expect(sections.some(s => s.id === id)).toBe(true);
    }
  });
});
