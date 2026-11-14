import { describe, expect, it } from "vitest";
import { songOfSolomon5Study } from "./song-of-solomon-5-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 5 — estudo", () => {
  it("está integrado no catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-5"]).toBe(songOfSolomon5Study);
  });
  it("cobre os 16 versículos com paráfrase livre e exposição", () => {
    const reading = songOfSolomon5Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 16; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon5Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui perícopes, tratamento da violência e formação", () => {
    for (const id of ["contexto", "estrutura", "pericope-jardim", "pericope-porta", "pericope-guardas", "pericope-retrato", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon5Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(songOfSolomon5Study.sections.map((s) => s.id)).size).toBe(songOfSolomon5Study.sections.length);
  });
});
