import { describe, expect, it } from "vitest";
import { songOfSolomon8Study } from "./song-of-solomon-8-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 8 — estudo", () => {
  it("integra o capítulo ao catálogo", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-8"]).toBe(songOfSolomon8Study);
  });
  it("inclui leitura e exposição dos 14 versículos", () => {
    const reading = songOfSolomon8Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 14; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon8Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes, interpretação e oficina", () => {
    for (const id of ["contexto", "estrutura", "pericope-proximidade", "pericope-amor", "pericope-irma", "pericope-vinhas", "pericope-final", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon8Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(songOfSolomon8Study.sections.map((s) => s.id)).size).toBe(songOfSolomon8Study.sections.length);
  });
  it("tem os oito capítulos de Cântico dos Cânticos no catálogo", () => {
    for (let chapter = 1; chapter <= 8; chapter++) {
      expect(CURATED_STUDIES[`biblia-cantico-dos-canticos-cap-${chapter}`]).toBeDefined();
    }
  });
});
