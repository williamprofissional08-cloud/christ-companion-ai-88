import { describe, expect, it } from "vitest";
import { mark7Study } from "./mark-7-study";
describe("Marcos 7 — integridade editorial", () => {
  it("cobre 37 versículos sem duplicar IDs", () => {
    const sections = mark7Study.sections ?? [];
    expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
    const verses = sections.filter(s => /^versiculo-\d+$/.test(s.id));
    expect(verses).toHaveLength(37);
    for (let n=1;n<=37;n++) {
      const section = verses.find(s => s.id === `versiculo-${n}`);
      expect(section?.scriptureRefs).toContain(`Marcos 7:${n}`);
      expect(section?.body).toContain("Paráfrase explicativa livre");
      expect((section?.body.length ?? 0)).toBeGreaterThan(85);
    }
  });
  it("inclui exposição e oficina", () => {
    for (const id of ["leitura","contexto","estrutura","exposicao-1","exposicao-2","exposicao-3","exposicao-4","referencias","interpretacao","teologia","aplicacao","perguntas","oficina","resumo","oracao-final"]) {
      expect((mark7Study.sections?.find(s => s.id === id)?.body.length ?? 0)).toBeGreaterThan(80);
    }
  });
});
