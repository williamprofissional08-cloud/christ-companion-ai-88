import { describe, expect, it } from "vitest";
import { songOfSolomon6Study } from "./song-of-solomon-6-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 6 — estudo", () => {
  it("integra o capítulo ao catálogo", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-6"]).toBe(songOfSolomon6Study);
  });
  it("inclui leitura e exposição dos 13 versículos", () => {
    const reading = songOfSolomon6Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 13; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon6Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("explicita perícopes e incertezas textuais", () => {
    for (const id of ["contexto", "estrutura", "pericope-jardim", "pericope-elogio", "pericope-corte", "pericope-sulamita", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon6Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(songOfSolomon6Study.sections.find((s) => s.id === "pericope-sulamita")?.body).toContain("difícil");
    expect(new Set(songOfSolomon6Study.sections.map((s) => s.id)).size).toBe(songOfSolomon6Study.sections.length);
  });
});
