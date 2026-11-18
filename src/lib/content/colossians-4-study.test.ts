import { describe, expect, it } from "vitest";
import { colossians4Study } from "./colossians-4-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Colossenses 4 — integridade", () => {
  it("cobre os 18 versículos na paráfrase original", () => {
    const reading = colossians4Study.sections.find(s => s.id === "leitura-integral");
    expect(reading?.body).toContain("não é tradução bíblica oficial");
    for (let verse = 1; verse <= 18; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(colossians4Study.sections.some(s => s.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("tem IDs únicos e os blocos editoriais exigidos", () => {
    const ids = colossians4Study.sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(18);
    for (const id of ["contexto", "estrutura", "referencias", "interpretacoes", "cuidados", "perguntas", "oficina", "oracao"]) {
      expect(ids).toContain(id);
    }
  });
  it("possui uma entrada no catálogo", () => {
    expect(CURATED_STUDIES["biblia-colossenses-cap-4"]).toBe(colossians4Study);
  });
});
