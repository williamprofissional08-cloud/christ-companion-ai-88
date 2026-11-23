import { describe, expect, it } from "vitest";
import { hebrews7Study } from "./hebrews-7-study";

describe("Hebreus 7 — integridade editorial", () => {
  it("preserva IDs únicos e seções completas", () => {
    const ids = hebrews7Study.sections.map((section) => section.id);
    expect(ids.length).toBeGreaterThanOrEqual(18);
    expect(new Set(ids).size).toBe(ids.length);
    expect(hebrews7Study.sections.some((section) => section.id === "leitura-integral")).toBe(true);
    expect(hebrews7Study.sections.some((section) => section.id === "pregador")).toBe(true);
    expect(hebrews7Study.sections.some((section) => section.id === "oracao")).toBe(true);
  });

  it("inclui todos os 28 versículos em paráfrase sinalizada", () => {
    const reading = hebrews7Study.sections.find((section) => section.id === "leitura-integral");
    expect(reading?.body).toContain("não tradução bíblica oficial");
    for (let verse = 1; verse <= 28; verse += 1) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(hebrews7Study.sections.some((section) => section.id === `exposicao-versiculo-${verse}`)).toBe(true);
    }
  });
});
