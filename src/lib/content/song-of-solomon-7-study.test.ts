import { describe, expect, it } from "vitest";
import { songOfSolomon7Study } from "./song-of-solomon-7-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 7 — estudo", () => {
  it("integra o capítulo ao catálogo", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-7"]).toBe(songOfSolomon7Study);
  });
  it("inclui leitura e exposição dos 13 versículos", () => {
    const reading = songOfSolomon7Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 13; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon7Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes, interpretação e oficina", () => {
    for (const id of ["contexto", "estrutura", "pericope-elogio", "pericope-desejo", "pericope-convite", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon7Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(songOfSolomon7Study.sections.map((s) => s.id)).size).toBe(songOfSolomon7Study.sections.length);
  });
});
