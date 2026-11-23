import { describe, expect, it } from "vitest";
import { songOfSolomon1Study } from "./song-of-solomon-1-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 1 — estudo", () => {
  it("mantém a integração canônica", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-1"]).toBe(songOfSolomon1Study);
  });
  it("apresenta paráfrase livre e exposição dos 17 versículos", () => {
    const reading = songOfSolomon1Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 17; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon1Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("preserva perícope, interpretações e oficina", () => {
    for (const id of ["contexto", "estrutura", "pericope-desejo", "pericope-identidade", "pericope-busca", "pericope-elogios", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon1Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(songOfSolomon1Study.sections.map((s) => s.id)).size).toBe(songOfSolomon1Study.sections.length);
  });
});
