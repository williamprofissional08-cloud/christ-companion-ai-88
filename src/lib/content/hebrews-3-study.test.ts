import { describe, expect, it } from "vitest";
import { hebrews3Study } from "./hebrews-3-study";

describe("Hebreus 3 — integridade editorial", () => {
  it("cobre os 19 versículos com leitura autoral e exposição individual", () => {
    const leitura = hebrews3Study.sections.find((s) => s.id === "leitura-integral");
    expect(leitura).toBeDefined();
    for (let v = 1; v <= 19; v++) {
      expect(leitura?.body).toContain(`**${v}.**`);
      expect(hebrews3Study.sections.some((s) => s.id === `exposicao-versiculo-${v}`)).toBe(true);
    }
    expect(leitura?.body).toContain("não tradução bíblica oficial");
  });
  it("mantém IDs únicos, seções completas e cuidados editoriais", () => {
    const ids = hebrews3Study.sections.map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(30);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["contexto", "interpretacoes", "referencias-cruzadas", "perguntas-respostas", "oficina-pregador", "oracao"]) expect(ids).toContain(id);
    expect(hebrews3Study.sections.every((s) => s.body.trim().length > 30)).toBe(true);
  });
});
