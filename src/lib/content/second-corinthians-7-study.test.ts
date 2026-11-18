import { describe, expect, it } from "vitest";
import { secondCorinthians7Study } from "./second-corinthians-7-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("2 Coríntios 7 — integridade", () => {
  it("cobre todos os 16 versículos com IDs únicos e conteúdo próprio", () => {
    const sections = secondCorinthians7Study.sections;
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
    for (let n = 1; n <= 16; n++) {
      expect(sections.some((s) => s.id === `exposicao-versiculo-${n}` && s.scriptureRefs?.includes(`2 Coríntios 7:${n}`))).toBe(true);
    }
    expect(sections.find((s) => s.id === "leitura-integral")?.body).toContain("paráfrase livre original");
    expect(sections.some((s) => s.id === "oficina-do-pregador")).toBe(true);
    expect(sections.some((s) => s.id === "perguntas-e-respostas")).toBe(true);
    expect(CURATED_STUDIES["biblia-2-corintios-cap-7"]).toBe(secondCorinthians7Study);
  });
});
