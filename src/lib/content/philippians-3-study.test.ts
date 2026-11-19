import { describe, expect, it } from "vitest";
import { philippians3Study as study } from "./philippians-3-study";

describe("Filipenses 3 — integridade editorial", () => {
  it("cobre os 21 versículos em ordem e com IDs únicos", () => {
    const sections = study.sections ?? [];
    const ids = sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(sections.filter(s => /^versiculo-\d+$/.test(s.id))).toHaveLength(21);
    for (let n = 1; n <= 21; n++) {
      const section = sections.find(s => s.id === `versiculo-${n}`);
      expect(section?.scriptureRefs).toContain(`Filipenses 3:${n}`);
      expect(section?.body).toContain("Paráfrase livre original:");
      expect(section?.body).toContain("Exposição contextual:");
    }
  });
  it("preserva perícopes e seções editoriais", () => {
    const ids = new Set((study.sections ?? []).map(s => s.id));
    for (const id of ["leitura-aviso", "pericope-1", "pericope-2", "pericope-3", "pericope-4", "interpretacao-e-inferencia", "referencias-cruzadas", "aplicacao", "perguntas-respostas", "oficina-pregador", "oracao-final"]) expect(ids.has(id)).toBe(true);
  });
});
