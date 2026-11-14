import { describe, expect, it } from "vitest";
import { CURATED_STUDIES } from "./curated-studies";
import { isaiah8Study } from "./isaiah-8-study";
import { isaiah9Study } from "./isaiah-9-study";
import { isaiah10Study } from "./isaiah-10-study";
import { isaiah11Study } from "./isaiah-11-study";
import { isaiah12Study } from "./isaiah-12-study";
import { isaiah13Study } from "./isaiah-13-study";
import { isaiah14Study } from "./isaiah-14-study";
import { isaiah15Study } from "./isaiah-15-study";
import { isaiah16Study } from "./isaiah-16-study";
import { isaiah17Study } from "./isaiah-17-study";

const cases = [
  [8, 22, isaiah8Study],
  [9, 21, isaiah9Study],
  [10, 34, isaiah10Study],
  [11, 16, isaiah11Study],
  [12, 6, isaiah12Study],
  [13, 22, isaiah13Study],
  [14, 32, isaiah14Study],
  [15, 9, isaiah15Study],
  [16, 14, isaiah16Study],
  [17, 14, isaiah17Study],
] as const;

describe("Lote Isaías 8–17", () => {
  for (const [chapter, count, study] of cases) {
    it(`capítulo ${chapter} cobre todos os versículos e está no catálogo`, () => {
      expect(CURATED_STUDIES[`biblia-isaias-cap-${chapter}`]).toBe(study);
      const reading = study.sections.find((s) => s.id === "leitura-biblica");
      expect(reading?.body).toContain("BLIVRE");
      for (let v = 1; v <= count; v++) {
        expect(reading?.body).toContain(`**${v}.**`);
        expect(study.sections.some((s) => s.id === `versiculo-${v}`)).toBe(true);
      }
      expect(new Set(study.sections.map((s) => s.id)).size).toBe(study.sections.length);
      for (const id of ["contexto", "estrutura", "termos", "referencias", "interpretacoes", "cristo", "aplicacao", "exercicios", "oficina-pregador", "oracao"]) {
        expect(study.sections.some((s) => s.id === id)).toBe(true);
      }
    });
  }
});
