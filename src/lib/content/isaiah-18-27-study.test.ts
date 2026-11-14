import { describe, expect, it } from "vitest";
import { CURATED_STUDIES } from "./curated-studies";
import { isaiah18Study } from "./isaiah-18-study";
import { isaiah19Study } from "./isaiah-19-study";
import { isaiah20Study } from "./isaiah-20-study";
import { isaiah21Study } from "./isaiah-21-study";
import { isaiah22Study } from "./isaiah-22-study";
import { isaiah23Study } from "./isaiah-23-study";
import { isaiah24Study } from "./isaiah-24-study";
import { isaiah25Study } from "./isaiah-25-study";
import { isaiah26Study } from "./isaiah-26-study";
import { isaiah27Study } from "./isaiah-27-study";

const chapters = [
  [18, 7, isaiah18Study],
  [19, 25, isaiah19Study],
  [20, 6, isaiah20Study],
  [21, 17, isaiah21Study],
  [22, 25, isaiah22Study],
  [23, 18, isaiah23Study],
  [24, 23, isaiah24Study],
  [25, 12, isaiah25Study],
  [26, 21, isaiah26Study],
  [27, 13, isaiah27Study],
] as const;

describe("Estudos Isaías 18–27", () => {
  for (const [chapter, verseCount, study] of chapters) {
    it(`Isaías ${chapter}: catálogo, leitura e comentários`, () => {
      expect(CURATED_STUDIES[`biblia-isaias-cap-${chapter}`]).toBe(study);
      const sections = study.sections ?? [];
      expect(sections).toBeDefined();
      const reading = sections.find((s) => s.id === "leitura-biblica");
      expect(reading?.body).toContain("BLIVRE");
      for (let verse = 1; verse <= verseCount; verse++) {
        expect(reading?.body).toContain(`**${verse}.**`);
        expect(sections.some((s) => s.id === `versiculo-${verse}`)).toBe(true);
      }
      expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
      for (const id of ["contexto", "estrutura", "termos", "referencias", "interpretacoes", "cristo", "aplicacao", "exercicios", "oficina-pregador", "oracao"]) {
        expect(sections.some((s) => s.id === id)).toBe(true);
      }
    });
  }
});
