import { describe, expect, it } from "vitest";
import { songOfSolomon3Study } from "./song-of-solomon-3-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Cântico dos Cânticos 3 — estudo", () => {
  it("está integrado no catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-cantico-dos-canticos-cap-3"]).toBe(songOfSolomon3Study);
  });
  it("apresenta paráfrase livre e 11 exposições individuais", () => {
    const reading = songOfSolomon3Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 11; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(songOfSolomon3Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("contém perícopes, interpretação, exercícios e oração", () => {
    for (const id of ["contexto", "estrutura", "pericope-busca", "pericope-refrão", "pericope-procissao", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(songOfSolomon3Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(songOfSolomon3Study.sections.map((s) => s.id)).size).toBe(songOfSolomon3Study.sections.length);
  });
});
