import { describe, expect, it } from "vitest";
import { firstCorinthians9Study } from "./first-corinthians-9-study";

describe("1 Coríntios 9 — integridade editorial", () => {
  it("contém os 27 versículos em ordem na paráfrase livre", () => {
    const scripture = firstCorinthians9Study.sections.find(s => s.id === "leitura-integral");
    expect(scripture?.body).toContain("não tradução bíblica oficial");
    const numbers = [...(scripture?.body ?? "").matchAll(/\*\*(\d+)\.\*\*/g)].map(m => Number(m[1]));
    expect(numbers).toEqual(Array.from({ length: 27 }, (_, i) => i + 1));
  });
  it("possui IDs únicos e blocos essenciais", () => {
    const ids = firstCorinthians9Study.sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("referencias-cruzadas");
    expect(ids).toContain("perguntas-respostas");
    expect(ids).toContain("oficina-pregador");
    expect(ids).toContain("oracao");
    for (let n = 1; n <= 27; n++) expect(ids).toContain(`versiculo-${n}`);
  });
});
