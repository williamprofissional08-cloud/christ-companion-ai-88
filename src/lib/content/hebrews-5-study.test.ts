import { describe, expect, it } from "vitest";
import { hebrews5Study } from "./hebrews-5-study";

describe("Hebreus 5 — integridade editorial", () => {
  it("mantém leitura de todos os 14 versículos em ordem", () => {
    const leitura = hebrews5Study.sections.find((section) => section.id === "leitura-integral");
    expect(leitura).toBeDefined();
    expect(leitura?.body).toContain("não é tradução bíblica oficial");
    for (let verse = 1; verse <= 14; verse++) {
      expect(leitura?.body).toContain(`**${verse}.**`);
      expect(hebrews5Study.sections.some((section) => section.id === `exposicao-versiculo-${verse}`)).toBe(true);
    }
    expect(leitura?.body).not.toContain("**15.**");
  });
  it("possui IDs únicos e seções pedagógicas essenciais", () => {
    const ids = hebrews5Study.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(18);
    for (const id of ["contexto", "estrutura", "referencias-cruzadas", "interpretacoes", "aplicacao", "perguntas", "oficina-pregador", "oracao"]) {
      expect(ids).toContain(id);
    }
    expect(hebrews5Study.crossReferences.length).toBeGreaterThan(0);
    expect(hebrews5Study.questions.length).toBeGreaterThan(0);
  });
});
