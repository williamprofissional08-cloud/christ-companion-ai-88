import { describe, expect, it } from "vitest";
import { firstTimothy4Study } from "./1-timothy-4-study";

describe("1 Timóteo 4 — integridade", () => {
  it("mantém leitura e exposição dos 16 versículos, sem IDs duplicados", () => {
    const sections = firstTimothy4Study.sections;
    const ids = sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("leitura-integral");
    const reading = sections.find((s) => s.id === "leitura-integral");
    expect(reading?.body).toContain("não é tradução bíblica oficial");
    for (let verse = 1; verse <= 16; verse++) {
      expect(ids).toContain(`versiculo-${verse}`);
      expect(reading?.body).toContain(`**${verse}.**`);
    }
    expect(sections.length).toBeGreaterThanOrEqual(18);
    for (const section of sections) {
      expect(section.body.trim().length).toBeGreaterThan(30);
    }
  });
});
