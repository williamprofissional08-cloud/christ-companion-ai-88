import { describe, expect, it } from "vitest";
import { luke15Study } from "./luke-15-study";

describe("Lucas 15 — integridade editorial", () => {
  it("cobre os 32 versículos uma única vez e mantém IDs únicos", () => {
    const ids = luke15Study.sections.map(section => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    const verses = luke15Study.sections.filter(section => /^versiculo-\d+$/.test(section.id));
    expect(verses).toHaveLength(32);
    for (let verse = 1; verse <= 32; verse++) {
      expect(verses[verse - 1].id).toBe(`versiculo-${verse}`);
      expect(verses[verse - 1].scriptureRefs).toContain(`Lucas 15:${verse}`);
      expect(verses[verse - 1].body).toContain("Paráfrase explicativa livre original");
    }
  });
  it("contém elementos essenciais de formação e cuidado", () => {
    for (const id of ["leitura-integral","contexto","interpretacao","referencias","perguntas","oficina","oracao"]) {
      expect(luke15Study.sections.some(section => section.id === id)).toBe(true);
    }
  });
});
