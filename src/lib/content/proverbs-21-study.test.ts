import { describe, expect, it } from "vitest";
import { proverbs21Study } from "./proverbs-21-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 21 — integridade do estudo", () => {
  it("está integrado sob o identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-21"]).toBe(proverbs21Study);
  });
  it("contém 31 versículos em paráfrase livre e exposição individual", () => {
    const reading = proverbs21Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 31; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs21Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui exegese, interpretação, referências, exercícios e oficina", () => {
    for (const id of ["estrutura", "termos", "referencias", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs21Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs21Study.sections.map((section) => section.id)).size).toBe(proverbs21Study.sections.length);
  });
});
