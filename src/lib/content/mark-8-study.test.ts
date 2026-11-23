import { describe, expect, it } from "vitest";
import { mark8Study } from "./mark-8-study";
describe("Marcos 8 — integridade editorial", () => {
  it("cobre os 38 versículos em ordem, sem IDs duplicados", () => {
    const sections = mark8Study.sections ?? [];
    expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
    const verses = sections.filter(s => /^versiculo-\d+$/.test(s.id));
    expect(verses).toHaveLength(38);
    for (let n = 1; n <= 38; n++) {
      const section = verses[n - 1];
      expect(section?.id).toBe(`versiculo-${n}`);
      expect(section?.scriptureRefs).toContain(`Marcos 8:${n}`);
      expect(section?.body).toContain("Paráfrase explicativa livre");
      expect((section?.body.length ?? 0)).toBeGreaterThan(85);
    }
  });
  it("inclui exposição específica e oficina", () => {
    for (const id of ["leitura","contexto","estrutura","exposicao-1","exposicao-2","exposicao-3","exposicao-4","exposicao-5","referencias","interpretacao","teologia","aplicacao","perguntas","oficina","resumo","oracao-final"]) {
      expect((mark8Study.sections?.find(s => s.id === id)?.body.length ?? 0)).toBeGreaterThan(80);
    }
  });
});
