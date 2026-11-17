import { describe, expect, it } from "vitest";
import { titus2Study } from "./titus-2-study";

describe("Tito 2 — integridade editorial", () => {
  it("mantém seções com IDs únicos e cobertura dos quinze versículos", () => {
    const sections = titus2Study.sections ?? [];
    const ids = sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(sections.length).toBeGreaterThanOrEqual(18);
    const exposition = sections.filter((section) => /^exposicao-versiculo-\\d+$/.test(section.id));
    expect(exposition.map((section) => section.id)).toEqual(
      Array.from({ length: 15 }, (_, index) => `exposicao-versiculo-${index + 1}`),
    );
    const reading = sections.find((section) => section.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    for (let verse = 1; verse <= 15; verse += 1) {
      expect(reading?.body).toContain(`**${verse}.**`);
    }
  });
  it("inclui cuidados editoriais e recursos de ensino", () => {
    const text = (titus2Study.sections ?? []).map((section) => section.body).join(" ");
    expect(text).toMatch(/escravidão/);
    expect(text).toMatch(/violência/);
    expect((titus2Study.sections ?? []).some((section) => section.id === "oficina-pregador")).toBe(true);
    expect((titus2Study.sections ?? []).some((section) => section.id === "perguntas-respostas")).toBe(true);
    expect((titus2Study.sections ?? []).some((section) => section.id === "oracao-final")).toBe(true);
  });
});
