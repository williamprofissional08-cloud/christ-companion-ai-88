import { describe, expect, it } from "vitest";
import { proverbs5Study } from "./proverbs-5-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 5 — integridade do estudo", () => {
  it("integra o capítulo sem mudar o identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-5"]).toBe(proverbs5Study);
  });
  it("contém paráfrase livre e exposição de todos os 23 versículos", () => {
    const reading = proverbs5Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 23; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs5Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui interpretação, aplicações, exercícios e oficina do pregador", () => {
    for (const id of ["contexto", "estrutura", "referencias", "interpretacoes", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs5Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs5Study.sections.map((section) => section.id)).size).toBe(proverbs5Study.sections.length);
  });
});
