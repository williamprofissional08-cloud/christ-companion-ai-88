import { describe, expect, it } from "vitest";
import { proverbs4Study } from "./proverbs-4-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 4 — integridade do estudo", () => {
  it("usa o identificador canônico e preserva o catálogo", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-4"]).toBe(proverbs4Study);
  });

  it("contém 27 versículos em paráfrase livre e exposição individual", () => {
    const reading = proverbs4Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 27; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs4Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });

  it("inclui exegese, referências, exercícios, pregação e oração", () => {
    for (const id of ["contexto", "estrutura", "referencias", "interpretacoes", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs4Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs4Study.sections.map((section) => section.id)).size).toBe(proverbs4Study.sections.length);
  });
});
