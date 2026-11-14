import { describe, expect, it } from "vitest";
import { proverbs19Study } from "./proverbs-19-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 19 — integridade do estudo", () => {
  it("integra o catálogo sob o identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-19"]).toBe(proverbs19Study);
  });
  it("contém paráfrase integral e exposição dos 29 versículos", () => {
    const reading = proverbs19Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 29; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs19Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui leitura social, exegese, exercícios e pregação", () => {
    for (const id of ["estrutura", "exegese-social", "exegese-justica", "exegese-familia", "referencias", "interpretacoes", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs19Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs19Study.sections.map((section) => section.id)).size).toBe(proverbs19Study.sections.length);
  });
});
