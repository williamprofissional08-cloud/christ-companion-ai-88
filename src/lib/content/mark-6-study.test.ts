import { describe, expect, it } from "vitest";
import { mark6Study } from "./mark-6-study";

describe("Marcos 6 — integridade editorial", () => {
  it("cobre os 56 versículos em sequência, uma única vez", () => {
    const verseSections = mark6Study.sections?.filter(s => /^versiculo-\d+$/.test(s.id)) ?? [];
    expect(verseSections).toHaveLength(56);
    expect(new Set(mark6Study.sections?.map(s => s.id)).size).toBe(mark6Study.sections?.length);
    for (let verse = 1; verse <= 56; verse++) {
      const section = verseSections.find(s => s.id === `versiculo-${verse}`);
      expect(section?.scriptureRefs).toContain(`Marcos 6:${verse}`);
      expect(section?.body).toContain("Paráfrase explicativa livre");
      expect(section?.body.length).toBeGreaterThan(85);
    }
  });
  it("inclui exposição de todas as perícopes e recursos pedagógicos", () => {
    for (const id of ["leitura", "contexto", "estrutura", "exposicao-1", "exposicao-2", "exposicao-3", "exposicao-4", "referencias", "interpretacao", "teologia", "aplicacao", "perguntas", "oficina", "resumo", "oracao-final"]) {
      const section = mark6Study.sections?.find(s => s.id === id);
      expect(section?.body.length).toBeGreaterThan(80);
    }
  });
});
