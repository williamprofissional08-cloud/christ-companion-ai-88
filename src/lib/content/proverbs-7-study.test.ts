import { describe, expect, it } from "vitest";
import { proverbs7Study } from "./proverbs-7-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 7 — integridade do estudo", () => {
  it("está integrado no identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-7"]).toBe(proverbs7Study);
  });
  it("apresenta 27 versículos em paráfrase e exposição individual", () => {
    const reading = proverbs7Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 27; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs7Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes, interpretação, exercícios, pregação e oração", () => {
    for (const id of ["estrutura", "referencias", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs7Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs7Study.sections.map((section) => section.id)).size).toBe(proverbs7Study.sections.length);
  });
});
