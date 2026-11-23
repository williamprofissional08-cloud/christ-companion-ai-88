import { describe, expect, it } from "vitest";
import { mark3Study } from "./mark-3-study";

describe("Marcos 3 — integridade", () => {
  it("cobre todos os 35 versículos com IDs estáveis e únicos", () => {
    const ids = mark3Study.sections.map(section => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let verse = 1; verse <= 35; verse++) {
      const section = mark3Study.sections.find(item => item.id === `versiculo-${verse}`);
      expect(section?.scriptureRefs).toContain(`Marcos 3:${verse}`);
      expect(section?.body).toContain("Paráfrase explicativa livre");
    }
  });
  it("inclui orientação de leitura e recursos didáticos", () => {
    expect(mark3Study.sections.some(section => section.id === "leitura")).toBe(true);
    for (const id of ["contexto","sabado","blasfemia","exercicios","pregador","oracao"]) {
      expect(mark3Study.sections.some(section => section.id === id)).toBe(true);
    }
  });
});
