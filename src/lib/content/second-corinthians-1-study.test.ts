import { describe, expect, it } from "vitest";
import { secondCorinthians1Study as study } from "./second-corinthians-1-study";

describe("2 Coríntios 1 — integridade editorial", () => {
  it("cobre os 24 versículos uma vez e preserva IDs estáveis", () => {
    const sections = study.sections ?? [];
    const ids = sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const verseSections = sections.filter((s) => /^versiculo-\d+$/.test(s.id));
    expect(verseSections).toHaveLength(24);
    for (let n = 1; n <= 24; n++) {
      const section = sections.find((s) => s.id === `versiculo-${n}`);
      expect(section).toBeDefined();
      expect(section?.scriptureRefs).toContain(`2 Coríntios 1:${n}`);
      expect(section?.body).toContain("Paráfrase livre original:");
      expect(section?.body).toContain("Exposição contextual:");
    }
  });
  it("inclui componentes didáticos e cautelas", () => {
    const ids = new Set((study.sections ?? []).map((s) => s.id));
    for (const id of ["leitura-aviso","interpretacao-e-inferencia","referencias-cruzadas","aplicacao","perguntas-respostas","oficina-pregador","oracao-final"]) expect(ids.has(id)).toBe(true);
    expect(study.questions.length).toBeGreaterThanOrEqual(8);
    expect(study.keyPoints.length).toBeGreaterThanOrEqual(4);
  });
});
