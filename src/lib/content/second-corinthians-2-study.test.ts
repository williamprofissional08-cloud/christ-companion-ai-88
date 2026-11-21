import { describe, expect, it } from "vitest";
import { secondCorinthians2Study } from "./second-corinthians-2-study";

describe("2 Coríntios 2 — integridade editorial", () => {
  it("cobre todos os 17 versículos em ordem, sem duplicar IDs", () => {
    const sections = secondCorinthians2Study.sections;
    const ids = sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let verse = 1; verse <= 17; verse += 1) {
      const section = sections.find((entry) => entry.id === `versiculo-${verse}`);
      expect(section).toBeDefined();
      expect(section?.scriptureRefs).toContain(`2 Coríntios 2:${verse}`);
      expect(section?.body).toContain("Paráfrase livre original");
    }
    expect(sections.length).toBeGreaterThanOrEqual(28);
    expect(secondCorinthians2Study.crossReferences.length).toBeGreaterThanOrEqual(4);
    expect(secondCorinthians2Study.questions.length).toBeGreaterThanOrEqual(6);
    expect(sections.some((section) => section.id === "oficina-pregador")).toBe(true);
    expect(sections.some((section) => section.id === "oracao-final")).toBe(true);
  });
});
