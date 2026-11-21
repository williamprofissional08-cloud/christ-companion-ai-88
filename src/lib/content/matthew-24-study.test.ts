import { describe, expect, it } from "vitest";
import { matthew24Study } from "./matthew-24-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Mateus 24 — integridade", () => {
  it("possui exatamente uma seção por versículo de 1 a 51", () => {
    const ids = matthew24Study.sections.filter((s) => /^versiculo-\d+$/.test(s.id)).map((s) => Number(s.id.slice(10)));
    expect(ids).toEqual(Array.from({ length: 51 }, (_, i) => i + 1));
    expect(new Set(matthew24Study.sections.map((s) => s.id)).size).toBe(matthew24Study.sections.length);
  });
  it("está integrado sob o identificador estável", () => {
    expect(CURATED_STUDIES["biblia-mateus-cap-24"]).toBe(matthew24Study);
  });
  it("possui elementos editoriais essenciais", () => {
    expect(matthew24Study.sections.some((s) => s.id === "debates")).toBe(true);
    expect(matthew24Study.sections.some((s) => s.id === "exercicios")).toBe(true);
    expect(matthew24Study.sections.some((s) => s.id === "pregador")).toBe(true);
    expect(matthew24Study.sections.some((s) => s.id === "oracao")).toBe(true);
  });
});
