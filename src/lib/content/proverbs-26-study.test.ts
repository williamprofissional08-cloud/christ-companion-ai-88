import { describe, expect, it } from "vitest";
import { proverbs26Study } from "./proverbs-26-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 26 — integridade do estudo", () => {
  it("usa o identificador canônico do catálogo", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-26"]).toBe(proverbs26Study);
  });
  it("identifica a paráfrase e cobre os 28 versículos", () => {
    const reading = proverbs26Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let n = 1; n <= 28; n++) {
      expect(reading?.body).toContain(`**${n}.**`);
      expect(proverbs26Study.sections.some((s) => s.id === `versiculo-${n}`)).toBe(true);
    }
  });
  it("contém as perícopes, debates, exercícios e oficina", () => {
    for (const id of ["estrutura", "pericope-respostas", "pericope-trabalho", "pericope-linguagem", "referencias", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs26Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(proverbs26Study.sections.map((s) => s.id)).size).toBe(proverbs26Study.sections.length);
  });
});
