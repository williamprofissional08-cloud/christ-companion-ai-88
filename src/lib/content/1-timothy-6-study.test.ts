import { describe, expect, it } from "vitest";
import { firstTimothy6Study } from "./1-timothy-6-study";

describe("1 Timóteo 6 — integridade", () => {
  it("mantém leitura livre com os 21 versículos na ordem", () => {
    const reading = firstTimothy6Study.sections.find(s => s.id === "leitura-integral");
    expect(reading).toBeDefined();
    expect(reading?.body).toContain("Paráfrase livre original");
    const verseNumbers = Array.from(reading?.body.matchAll(/\*\*(\d+)\.\*\*/g) ?? [], m => Number(m[1]));
    expect(verseNumbers).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });
  it("não repete IDs e mantém as partes editoriais", () => {
    const sections = firstTimothy6Study.sections;
    expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
    expect(sections.length).toBeGreaterThanOrEqual(35);
    for (const id of ["contexto", "estrutura", "referencias", "interpretacoes", "cuidados", "aplicacao", "perguntas", "pregador", "oracao"]) {
      expect(sections.some(s => s.id === id)).toBe(true);
    }
    for (let n = 1; n <= 21; n++) expect(sections.some(s => s.id === `versiculo-${n}`)).toBe(true);
  });
});
