import { describe, expect, it } from "vitest";
import { secondCorinthians5Study } from "./second-corinthians-5-study";

describe("2 Coríntios 5 — integridade editorial", () => {
  it("identifica os 21 versículos na leitura original em ordem", () => {
    const leitura = secondCorinthians5Study.sections.find((section) => section.id === "leitura-integral");
    expect(leitura).toBeDefined();
    const numeros = [...(leitura?.body ?? "").matchAll(/\*\*(\d+)\.\*\*/g)].map((match) => Number(match[1]));
    expect(numeros).toEqual(Array.from({ length: 21 }, (_, index) => index + 1));
    expect(leitura?.body).toContain("não é tradução bíblica oficial");
  });

  it("mantém IDs únicos, exposições e perícopes sem lacunas", () => {
    const ids = secondCorinthians5Study.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let verse = 1; verse <= 21; verse++) expect(ids).toContain(`exposicao-versiculo-${verse}`);
    for (let section = 1; section <= 5; section++) expect(ids).toContain(`pericope-${section}`);
    for (const id of ["contexto-historico", "interpretacoes", "referencias-cruzadas", "aplicacao", "perguntas-respostas", "oficina-pregador", "oracao-final"]) expect(ids).toContain(id);
  });

  it("preserva campos essenciais preenchidos", () => {
    for (const field of [secondCorinthians5Study.intro, secondCorinthians5Study.historicalContext, secondCorinthians5Study.application, secondCorinthians5Study.conclusion, secondCorinthians5Study.prayer]) expect(field.trim().length).toBeGreaterThan(40);
    expect(secondCorinthians5Study.crossReferences.length).toBeGreaterThanOrEqual(5);
    expect(secondCorinthians5Study.questions.length).toBeGreaterThanOrEqual(5);
  });
});
