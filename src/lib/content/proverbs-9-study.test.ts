import { describe, expect, it } from "vitest";
import { proverbs9Study } from "./proverbs-9-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 9 — integridade editorial", () => {
  it("está integrado no catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-9"]).toBe(proverbs9Study);
  });
  it("inclui leitura em paráfrase e exposição dos 18 versículos", () => {
    const reading = proverbs9Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 18; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs9Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes, interpretação, exercícios, oficina e oração", () => {
    for (const id of ["estrutura", "exegese-1-6", "exegese-7-12", "exegese-13-18", "referencias", "interpretacoes", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs9Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs9Study.sections.map((section) => section.id)).size).toBe(proverbs9Study.sections.length);
  });
});
