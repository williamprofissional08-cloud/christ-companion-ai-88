import { describe, expect, it } from "vitest";
import { CURATED_STUDIES } from "./curated-studies";
import { ecclesiastes8Study } from "./ecclesiastes-8-study";
import { ecclesiastes9Study } from "./ecclesiastes-9-study";
import { ecclesiastes10Study } from "./ecclesiastes-10-study";
import { ecclesiastes11Study } from "./ecclesiastes-11-study";
import { ecclesiastes12Study } from "./ecclesiastes-12-study";

describe("Eclesiastes 8–12 — integração dos estudos existentes", () => {
  const chapters = [
    [8, ecclesiastes8Study, 17],
    [9, ecclesiastes9Study, 18],
    [10, ecclesiastes10Study, 20],
    [11, ecclesiastes11Study, 10],
    [12, ecclesiastes12Study, 14],
  ] as const;
  it.each(chapters)("capítulo %i tem catálogo e cobertura de %i versículos", (chapter, study, count) => {
    expect(CURATED_STUDIES[`biblia-eclesiastes-cap-${chapter}`]).toBe(study);
    const reading = study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toBeTruthy();
    for (let n = 1; n <= count; n++) {
      expect(study.sections.some((s) => s.id === `versiculo-${n}`)).toBe(true);
    }
    expect(new Set(study.sections.map((s) => s.id)).size).toBe(study.sections.length);
  });
});
