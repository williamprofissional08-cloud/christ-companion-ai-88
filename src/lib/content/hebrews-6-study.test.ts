import { describe, expect, it } from "vitest";
import { hebrews6Study } from "./hebrews-6-study";

describe("Hebreus 6 — integridade", () => {
  it("tem 34 seções com IDs únicos", () => {
    expect(hebrews6Study.sections).toHaveLength(34);
    expect(new Set(hebrews6Study.sections.map((s) => s.id)).size).toBe(34);
  });
  it("cobre 20 versículos na paráfrase e exposição", () => {
    const reading = hebrews6Study.sections.find((s) => s.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    for (let i = 1; i <= 20; i++) {
      expect(reading?.body).toContain("**" + i + ".**");
      expect(hebrews6Study.sections.some((s) => s.id === "exposicao-versiculo-" + i)).toBe(true);
    }
  });
});
