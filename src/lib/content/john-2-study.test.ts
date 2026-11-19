import { describe, expect, it } from "vitest";
import { john2Study } from "./john-2-study";

describe("João 2 — integridade editorial", () => {
  it("cobre os 25 versículos uma vez, em sequência", () => {
    const verses = john2Study.sections.filter((section) => /^versiculo-\d+$/.test(section.id));
    expect(verses).toHaveLength(25);
    expect(verses.map((section) => section.id)).toEqual(
      Array.from({ length: 25 }, (_, index) => `versiculo-${index + 1}`)
    );
    for (const [index, section] of verses.entries()) {
      expect(section.scriptureRefs).toContain(`João 2:${index + 1}`);
      expect(section.body).toContain("Paráfrase explicativa livre original");
      expect(section.body).toContain("Exposição contextual e limites");
    }
  });
  it("possui IDs únicos e elementos didáticos", () => {
    const ids = john2Study.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["leitura-integral", "introducao", "contexto", "estrutura", "referencias", "interpretacao", "perguntas", "exercicios", "aplicacao", "glossario", "pregador", "oracao"]) {
      expect(ids).toContain(id);
    }
  });
});
