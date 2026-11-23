import { describe, expect, it } from "vitest";
import { songOfSolomon2Study } from "./song-of-solomon-2-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 2 — estudo", () => {
  it("mantém a integração canônica", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-2"]).toBe(songOfSolomon2Study);
  });
  it("cobre individualmente os 17 versículos", () => {
    const reading = songOfSolomon2Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 17; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon2Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui exegese, interpretações e oficina", () => {
    for (const id of ["contexto", "estrutura", "pericope-flores", "pericope-tempo", "pericope-primavera", "pericope-vinhas", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon2Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(songOfSolomon2Study.sections.map((s) => s.id)).size).toBe(songOfSolomon2Study.sections.length);
  });
});
