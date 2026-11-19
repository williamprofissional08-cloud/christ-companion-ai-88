import { describe, expect, it } from "vitest";
import { philippians4Study as study } from "./philippians-4-study";

describe("Filipenses 4 — integridade editorial", () => {
  it("cobre 23 versículos e mantém IDs únicos", () => {
    const sections = study.sections ?? [];
    const ids = sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(sections.filter(s => /^versiculo-\d+$/.test(s.id))).toHaveLength(23);
    for (let n=1;n<=23;n++) {
      const section = sections.find(s => s.id === `versiculo-${n}`);
      expect(section?.scriptureRefs).toContain(`Filipenses 4:${n}`);
      expect(section?.body).toContain("Paráfrase livre original:");
      expect(section?.body).toContain("Exposição contextual:");
    }
  });
  it("preserva as seções editoriais", () => {
    const ids = new Set((study.sections ?? []).map(s=>s.id));
    for (const id of ["leitura-aviso","interpretacao-e-inferencia","referencias-cruzadas","aplicacao","perguntas-respostas","oficina-pregador","oracao-final"]) expect(ids.has(id)).toBe(true);
  });
});
