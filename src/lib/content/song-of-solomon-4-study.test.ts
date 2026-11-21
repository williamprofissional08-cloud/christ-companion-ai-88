import { describe, expect, it } from "vitest";
import { songOfSolomon4Study } from "./song-of-solomon-4-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 4 — estudo", () => {
  it("está integrado no catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-4"]).toBe(songOfSolomon4Study);
  });
  it("cobre os 16 versículos com paráfrase livre e exposição", () => {
    const reading = songOfSolomon4Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 16; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon4Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui análise de perícopes e formação do pregador", () => {
    for (const id of ["contexto", "estrutura", "pericope-elogio", "pericope-convite", "pericope-jardim", "pericope-resposta", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon4Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(songOfSolomon4Study.sections.map((s) => s.id)).size).toBe(songOfSolomon4Study.sections.length);
  });
});
