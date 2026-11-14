import { describe, expect, it } from "vitest";
import { proverbs28Study } from "./proverbs-28-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 28 — integridade editorial", () => {
  it("está integrado ao identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-28"]).toBe(proverbs28Study);
  });
  it("tem paráfrase livre e comentário específico dos 28 versículos", () => {
    const reading = proverbs28Study.sections?.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let n = 1; n <= 28; n++) {
      expect(reading?.body).toContain(`**${n}.**`);
      const verse = proverbs28Study.sections?.find((s) => s.id === `versiculo-${n}`);
      expect(verse?.body).toContain("Exegese e limite interpretativo");
      expect(verse?.scriptureRefs).toContain(`Provérbios 28:${n}`);
    }
  });
  it("não reutiliza o antigo comentário genérico nos versículos", () => {
    for (const section of proverbs28Study.sections ?? []) {
      if (section.id.startsWith("versiculo-")) {
        expect(section.body).not.toContain("A frase deve ser examinada em sua própria forma");
      }
    }
  });
});
