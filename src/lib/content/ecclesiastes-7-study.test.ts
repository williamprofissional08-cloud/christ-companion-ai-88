import { describe, expect, it } from "vitest";
import { ecclesiastes7Study } from "./ecclesiastes-7-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Eclesiastes 7 — cobertura e cautelas", () => {
  it("está integrado ao identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-eclesiastes-cap-7"]).toBe(ecclesiastes7Study);
  });
  it("cobre individualmente os 29 versículos", () => {
    const reading = ecclesiastes7Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 29; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(ecclesiastes7Study.sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("inclui exegese das perícopes e cautelas editoriais", () => {
    for (const id of ["contexto", "estrutura", "pericope-luto", "pericope-limites", "pericope-paradoxo", "pericope-genero", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(ecclesiastes7Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(ecclesiastes7Study.sections.map((s) => s.id)).size).toBe(ecclesiastes7Study.sections.length);
  });
});
