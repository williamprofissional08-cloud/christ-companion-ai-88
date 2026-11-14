import { describe, expect, it } from "vitest";
import { proverbs6Study } from "./proverbs-6-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 6 — integridade do estudo", () => {
  it("está integrado sob o ID canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-6"]).toBe(proverbs6Study);
  });
  it("contém 35 versículos em paráfrase e exposição individual", () => {
    const reading = proverbs6Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 35; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs6Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("contempla todas as perícopes, exercícios e oficina", () => {
    for (const id of ["estrutura", "referencias", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs6Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs6Study.sections.map((section) => section.id)).size).toBe(proverbs6Study.sections.length);
  });
});
