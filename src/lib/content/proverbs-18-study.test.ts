import { describe, expect, it } from "vitest";
import { proverbs18Study } from "./proverbs-18-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 18 — integridade do estudo", () => {
  it("está integrado no catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-18"]).toBe(proverbs18Study);
  });
  it("cobre os 24 versículos sem duplicação", () => {
    const reading = proverbs18Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 24; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs18Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
    expect(new Set(proverbs18Study.sections.map((section) => section.id)).size).toBe(proverbs18Study.sections.length);
  });
  it("contém análise, referências, exercícios e oficina", () => {
    for (const id of ["contexto", "estrutura", "termos", "referencias", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs18Study.sections.some((section) => section.id === id)).toBe(true);
    }
  });
});
