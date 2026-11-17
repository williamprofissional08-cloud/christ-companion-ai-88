import { describe, expect, it } from "vitest";
import { secondTimothy1Study } from "./2-timothy-1-study";

describe("2 Timóteo 1 — integridade editorial", () => {
  it("tem 18 versículos em sequência na paráfrase livre sinalizada", () => {
    const reading = secondTimothy1Study.sections.find((section) => section.id === "leitura-integral");
    expect(reading).toBeDefined();
    expect(reading?.body).toContain("Paráfrase livre original");
    const verses = Array.from(reading?.body.matchAll(/\*\*(\d+)\.\*\*/g), (match) => Number(match[1]));
    expect(verses).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
  });
  it("mantém identificadores únicos e conteúdo didático suficiente", () => {
    const sections = secondTimothy1Study.sections;
    expect(sections.length).toBeGreaterThanOrEqual(30);
    expect(new Set(sections.map((section) => section.id)).size).toBe(sections.length);
    for (const section of sections) {
      expect(section.body.trim().length).toBeGreaterThan(40);
      expect(section.scriptureRefs.length).toBeGreaterThan(0);
    }
    for (const id of ["contexto", "estrutura", "referencias", "interpretacoes", "cuidados", "aplicacao", "perguntas", "exercicios", "oficina", "oracao"]) {
      expect(sections.some((section) => section.id === id)).toBe(true);
    }
  });
});
