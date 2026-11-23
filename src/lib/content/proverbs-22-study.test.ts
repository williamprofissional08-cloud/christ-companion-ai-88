import { describe, expect, it } from "vitest";
import { proverbs22Study } from "./proverbs-22-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 22 — integridade do estudo", () => {
  it("está integrado no identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-22"]).toBe(proverbs22Study);
  });
  it("apresenta 29 versículos em paráfrase livre e exposição individual", () => {
    const reading = proverbs22Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 29; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs22Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes, debates, exercícios, pregação e oração", () => {
    for (const id of ["estrutura", "termos", "referencias", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs22Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs22Study.sections.map((section) => section.id)).size).toBe(proverbs22Study.sections.length);
  });
});
