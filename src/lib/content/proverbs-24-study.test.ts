import { describe, expect, it } from "vitest";
import { proverbs24Study } from "./proverbs-24-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 24 — integridade do estudo", () => {
  it("mantém o identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-24"]).toBe(proverbs24Study);
  });
  it("identifica a paráfrase e cobre os 34 versículos", () => {
    const reading = proverbs24Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let n = 1; n <= 34; n++) {
      expect(reading?.body).toContain(`**${n}.**`);
      expect(proverbs24Study.sections.some((s) => s.id === `versiculo-${n}`)).toBe(true);
    }
  });
  it("inclui perícopes, interpretações, aplicação, exercícios, pregação e oração", () => {
    for (const id of ["estrutura", "pericope-resgate", "pericope-inimigo", "pericope-campo", "referencias", "interpretacoes", "aplicacao", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs24Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(proverbs24Study.sections.map((s) => s.id)).size).toBe(proverbs24Study.sections.length);
  });
});
