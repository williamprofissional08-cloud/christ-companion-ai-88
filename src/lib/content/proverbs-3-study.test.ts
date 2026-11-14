import { describe, expect, it } from "vitest";
import { proverbs3Study } from "./proverbs-3-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 3 — integridade do estudo", () => {
  it("integra o estudo no identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-3"]).toBe(proverbs3Study);
  });
  it("contém os 35 versículos em leitura e exposição", () => {
    const reading = proverbs3Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 35; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs3Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("oferece exercícios, pregação e oração", () => {
    for (const id of ["exercicios", "oficina-pregador", "oracao", "interpretacoes", "cristo"]) {
      expect(proverbs3Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs3Study.sections.map((section) => section.id)).size).toBe(proverbs3Study.sections.length);
  });
});
