import { describe, expect, it } from "vitest";
import { secondCorinthians4Study } from "./second-corinthians-4-study";
import blivre from "../bible-livre/2-corintios.json";

describe("integridade editorial — 2 Coríntios 4", () => {
  it("cobre todos os versículos do BLIVRE com paráfrase identificada", () => {
    const verses = blivre.chapters["4"];
    expect(verses).toHaveLength(18);
    const reading = secondCorinthians4Study.sections.find((section) => section.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    for (let n = 1; n <= verses.length; n += 1) {
      expect(reading?.body).toContain(`**${n}.**`);
      expect(secondCorinthians4Study.sections.some((section) => section.id === `exposicao-versiculo-${n}`)).toBe(true);
    }
  });
  it("mantém IDs únicos e componentes pastorais e expositivos", () => {
    const sections = secondCorinthians4Study.sections;
    const ids = sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(sections.length).toBeGreaterThanOrEqual(30);
    for (const id of ["contexto-historico","referencias-cruzadas","interpretacao-e-inferencia","cuidados-pastorais","perguntas-respostas","oficina-pregador","oracao-final"]) {
      expect(ids).toContain(id);
    }
  });
});
