import { describe, expect, it } from "vitest";
import { mark5Study } from "./mark-5-study";

describe("Marcos 5 — integridade editorial", () => {
  it("cobre os 43 versículos uma única vez e preserva IDs", () => {
    const verseSections = mark5Study.sections.filter(s => /^versiculo-\d+$/.test(s.id));
    expect(verseSections).toHaveLength(43);
    expect(new Set(mark5Study.sections.map(s => s.id)).size).toBe(mark5Study.sections.length);
    for (let verse = 1; verse <= 43; verse++) {
      expect(verseSections.find(s => s.id === `versiculo-${verse}`)?.scriptureRefs).toContain(`Marcos 5:${verse}`);
    }
  });
  it("inclui as seções pedagógicas essenciais", () => {
    for (const id of ["leitura", "contexto", "estrutura", "exposicao-1", "exposicao-2", "exposicao-3", "referencias", "interpretacao", "aplicacao", "perguntas", "oficina", "oracao-final"]) {
      expect(mark5Study.sections.some(s => s.id === id && s.body.length > 80)).toBe(true);
    }
  });
});
