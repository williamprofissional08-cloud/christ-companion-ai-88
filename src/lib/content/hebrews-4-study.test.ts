import { describe, expect, it } from "vitest";
import { hebrews4Study } from "./hebrews-4-study";

describe("Hebreus 4 — integridade editorial", () => {
  it("cobre 16 versículos na paráfrase livre autoral", () => {
    const leitura = hebrews4Study.sections.find((s) => s.id === "leitura-integral");
    expect(leitura).toBeDefined();
    for (let v = 1; v <= 16; v++) {
      expect(leitura?.body).toContain(`**${v}.**`);
      expect(hebrews4Study.sections.some((s) => s.id === `exposicao-versiculo-${v}`)).toBe(true);
    }
    expect(leitura?.body).toContain("não tradução bíblica oficial");
  });
  it("tem IDs únicos e seções editoriais", () => {
    const ids = hebrews4Study.sections.map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(25);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["contexto", "interpretacoes", "referencias-cruzadas", "perguntas-respostas", "oficina-pregador", "oracao"]) expect(ids).toContain(id);
    expect(hebrews4Study.sections.every((s) => s.body.trim().length > 30)).toBe(true);
  });
});
